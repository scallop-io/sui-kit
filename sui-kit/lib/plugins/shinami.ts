export const SHINAMI_FULL_NODE_URL = 'https://node.shinami.com/api/v1'

export const getShinamiFullNodeUrl = (key: string) => {
  return `${SHINAMI_FULL_NODE_URL}/${key}`
}
