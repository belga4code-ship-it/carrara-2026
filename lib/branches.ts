export const BRANCHES = ["السبعة", "السبعة VIP", "عين زارا", "وادي الربيع"] as const;

export type BranchName = (typeof BRANCHES)[number];

export function isBranchName(value: string): value is BranchName {
  return BRANCHES.some((branch) => branch === value);
}
