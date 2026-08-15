import type { Question } from './types'

const GET_QUESTION_QUERY = `
  query getQuestion($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      title
      difficulty
      content
      exampleTestcases
      sampleTestCase
      metaData
      topicTags {
        name
        slug
      }
    }
  }
`

export async function fetchQuestion(titleSlug: string): Promise<Question> {
  const response = await fetch('https://leetcode.com/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: GET_QUESTION_QUERY,
      variables: { titleSlug },
    }),
  })

  if (!response.ok) {
    throw new Error(`LeetCode API error: ${response.status}`)
  }

  const data = await response.json()

  if (data.errors?.length) {
    throw new Error(data.errors[0].message ?? 'Failed to fetch problem')
  }

  const question = data.data?.question
  if (!question) {
    throw new Error('Problem not found. You may need to log in for premium problems.')
  }

  return question as Question
}
