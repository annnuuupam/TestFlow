package com.ots.service.executor;

import com.ots.dto.request.CodeRunRequest;
import com.ots.dto.response.CodeRunResponse;
import java.util.List;

public interface CodeExecutor {
    CodeRunResponse execute(String code, String language, List<CodeRunRequest.TestCaseInput> testCases);
}
