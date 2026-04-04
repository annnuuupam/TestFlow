import api from './axios'

export interface TestCaseInput {
  input: string
  expectedOutput: string
}

export interface TestCaseResult {
  index: number
  input: string
  expectedOutput: string
  actualOutput: string
  passed: boolean
  error?: string
  executionTimeMs: number
}

export interface CodeRunResponse {
  totalTests: number
  passed: number
  failed: number
  allPassed: boolean
  results: TestCaseResult[]
  compileError?: string
}

export const codeApi = {
  run: (payload: { code: string; language: string; testCases: TestCaseInput[] }): Promise<CodeRunResponse> =>
    api.post('/code/run', payload).then(r => r.data),
}
