package com.ots.service.executor;

import com.ots.dto.request.CodeRunRequest;
import com.ots.dto.response.CodeRunResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;

/**
 * Local process-based executor for development environments.
 * NOT RECOMMENDED FOR PRODUCTION.
 */
@Component
@Slf4j
public class LocalCodeExecutor implements CodeExecutor {

    private static final int TIMEOUT_SECONDS = 5;
    private static final ExecutorService executor = Executors.newCachedThreadPool();

    @Override
    public CodeRunResponse execute(String code, String language, List<CodeRunRequest.TestCaseInput> testCases) {
        String lang = language.toLowerCase();
        
        if (testCases == null || testCases.isEmpty()) {
            return CodeRunResponse.builder()
                    .totalTests(0).passed(0).failed(0).allPassed(true)
                    .results(List.of())
                    .build();
        }

        Path tmpDir = null;
        try {
            tmpDir = Files.createTempDirectory("coderun_" + UUID.randomUUID().toString().substring(0, 8));
            
            // Write source file
            String sourceFile = writeSourceFile(tmpDir, lang, code);

            // Compile if needed
            String compileError = compile(tmpDir, lang, sourceFile);
            if (compileError != null) {
                return CodeRunResponse.builder()
                        .totalTests(testCases.size()).passed(0).failed(testCases.size()).allPassed(false)
                        .compileError(compileError)
                        .results(buildCompileErrorResults(testCases, compileError))
                        .build();
            }

            // Run each test case
            List<CodeRunResponse.TestCaseResult> results = new ArrayList<>();
            int passed = 0;

            for (int i = 0; i < testCases.size(); i++) {
                CodeRunRequest.TestCaseInput tc = testCases.get(i);
                CodeRunResponse.TestCaseResult result = runSingleCase(tmpDir, lang, sourceFile, tc, i + 1);
                results.add(result);
                if (result.isPassed()) passed++;
            }

            return CodeRunResponse.builder()
                    .totalTests(testCases.size())
                    .passed(passed)
                    .failed(testCases.size() - passed)
                    .allPassed(passed == testCases.size())
                    .results(results)
                    .build();

        } catch (Exception e) {
            log.error("Local runner failed", e);
            return CodeRunResponse.builder()
                    .totalTests(testCases.size())
                    .passed(0).failed(testCases.size())
                    .allPassed(false)
                    .compileError("Internal runner error: " + e.getMessage())
                    .results(List.of())
                    .build();
        } finally {
            cleanup(tmpDir);
        }
    }

    private String writeSourceFile(Path dir, String lang, String code) throws IOException {
        String filename = switch (lang) {
            case "java"       -> "Solution.java";
            case "python"     -> "solution.py";
            case "cpp"        -> "solution.cpp";
            case "c"          -> "solution.c";
            case "javascript" -> "solution.js";
            default           -> "solution.txt";
        };
        Files.writeString(dir.resolve(filename), code, StandardCharsets.UTF_8);
        return filename;
    }

    private String compile(Path dir, String lang, String sourceFile) throws IOException, InterruptedException {
        List<String> cmd = switch (lang) {
            case "java" -> List.of("javac", sourceFile);
            case "cpp"  -> List.of("g++", "-o", "solution", sourceFile, "-std=c++17");
            case "c"    -> List.of("gcc", "-o", "solution", sourceFile);
            default     -> null;
        };
        if (cmd == null) return null;

        ProcessBuilder pb = new ProcessBuilder(cmd).directory(dir.toFile()).redirectErrorStream(true);
        Process proc = pb.start();
        String output = new String(proc.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        int exit = proc.waitFor();
        return exit != 0 ? output : null;
    }

    private CodeRunResponse.TestCaseResult runSingleCase(Path dir, String lang, String sourceFile,
                                                           CodeRunRequest.TestCaseInput tc, int idx) {
        long start = System.currentTimeMillis();
        try {
            List<String> cmd = buildRunCommand(dir, lang, sourceFile);
            ProcessBuilder pb = new ProcessBuilder(cmd).directory(dir.toFile()).redirectErrorStream(false);
            Process proc = pb.start();

            if (tc.getInput() != null && !tc.getInput().isBlank()) {
                try (OutputStream stdin = proc.getOutputStream()) {
                    stdin.write(tc.getInput().getBytes(StandardCharsets.UTF_8));
                }
            } else {
                proc.getOutputStream().close();
            }

            Future<String> stdoutFuture = executor.submit(() -> new String(proc.getInputStream().readAllBytes(), StandardCharsets.UTF_8));
            Future<String> stderrFuture = executor.submit(() -> new String(proc.getErrorStream().readAllBytes(), StandardCharsets.UTF_8));

            boolean finished = proc.waitFor(TIMEOUT_SECONDS, TimeUnit.SECONDS);
            long elapsed = System.currentTimeMillis() - start;

            if (!finished) {
                proc.destroyForcibly();
                return CodeRunResponse.TestCaseResult.builder().index(idx).passed(false).error("Time Limit Exceeded").executionTimeMs(elapsed).build();
            }

            String stdout = stdoutFuture.get(1, TimeUnit.SECONDS).trim();
            String stderr = stderrFuture.get(1, TimeUnit.SECONDS).trim();
            String expected = normalize(tc.getExpectedOutput());
            String actual   = normalize(stdout);
            boolean passed  = expected.equals(actual);

            return CodeRunResponse.TestCaseResult.builder()
                    .index(idx).input(tc.getInput()).expectedOutput(tc.getExpectedOutput())
                    .actualOutput(stdout).passed(passed)
                    .error(passed ? null : (stderr.isBlank() ? null : stderr))
                    .executionTimeMs(elapsed).build();

        } catch (Exception e) {
            return CodeRunResponse.TestCaseResult.builder().index(idx).passed(false).error("Runtime error: " + e.getMessage()).build();
        }
    }

    private List<String> buildRunCommand(Path dir, String lang, String sourceFile) {
        return switch (lang) {
            case "java"       -> List.of("java", "-cp", dir.toString(), "Solution");
            case "python"     -> List.of("python", sourceFile);
            case "cpp", "c"   -> List.of(dir.resolve("solution").toString());
            case "javascript" -> List.of("node", sourceFile);
            default           -> List.of("echo", "Unsupported language");
        };
    }

    private String normalize(String s) {
        if (s == null) return "";
        return s.trim().replaceAll("\r\n", "\n").stripTrailing();
    }

    private List<CodeRunResponse.TestCaseResult> buildCompileErrorResults(List<CodeRunRequest.TestCaseInput> testCases, String error) {
        List<CodeRunResponse.TestCaseResult> results = new ArrayList<>();
        for (int i = 0; i < testCases.size(); i++) {
            results.add(CodeRunResponse.TestCaseResult.builder().index(i + 1).passed(false).error(error).build());
        }
        return results;
    }

    private void cleanup(Path dir) {
        if (dir == null) return;
        try {
            Files.walk(dir).sorted((a, b) -> -a.compareTo(b)).forEach(p -> { try { Files.delete(p); } catch (IOException ignored) {} });
        } catch (IOException ignored) {}
    }
}
