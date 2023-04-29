/**
 * These are the basics types that can be used in the SUI
 */
export type SuiBasicTypes =
  |'address'
  |'bool'
  |'u8'
  | 'u16'
  | 'u32'
  | 'u64'
  | 'u128'
  | 'u256'

export type SuiInputTypes = 'object' | SuiBasicTypes

export const getDefaultSuiInputType = (value: any): SuiInputTypes => {
  if (typeof value === 'string' && value.startsWith('0x')) {
    return 'object'
  } else if (typeof value === 'number' || typeof value === 'bigint') {
    return 'u64'
  } else if (typeof value === 'boolean') {
    return 'bool'
  } else {
    return 'object'
  }
}
