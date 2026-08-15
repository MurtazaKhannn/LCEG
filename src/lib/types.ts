export interface TopicTag {
  name: string
  slug: string
}

export interface Question {
  questionId: string
  title: string
  difficulty: string
  content: string
  exampleTestcases: string
  sampleTestCase: string
  metaData: string
  topicTags: TopicTag[]
  paidOnly?: boolean
}

export interface ParsedExample {
  label: string
  input: string
  output: string
  explanation?: string
}

export interface ParamDef {
  name: string
  type: string
}

export interface ProblemSignature {
  name: string
  params: ParamDef[]
  returnType: string
}

export interface AiExample {
  label: 'simple' | 'medium' | 'edge'
  input: string
  output: string
  walkthrough: string[]
}

export interface AiExamplesResponse {
  examples: AiExample[]
}

export interface CachedAiExamples {
  examples: AiExample[]
  cachedAt: number
}

export interface Settings {
  geminiApiKey: string
  geminiModel: string
}
