package com.ots.controller;

import com.ots.dto.request.CodeRunRequest;
import com.ots.dto.response.CodeRunResponse;
import com.ots.service.CodeRunnerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/code")
@RequiredArgsConstructor
@Tag(name = "Code Runner", description = "Run code against test cases and get pass/fail results")
public class CodeRunController {

    private final CodeRunnerService codeRunnerService;

    @PostMapping("/run")
    @Operation(summary = "Run code against provided test cases, returns per-case pass/fail")
    public ResponseEntity<CodeRunResponse> run(@RequestBody CodeRunRequest request) {
        return ResponseEntity.ok(codeRunnerService.run(request));
    }
}
