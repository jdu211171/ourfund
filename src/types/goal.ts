export interface Goal {
  id: string;
  title: string;
  targetUsd: number;
  savedUsd: number;
  targetDate: string;
  icon: string;
  color: string;
  contributors: string[];
  history: {
    id: string;
    who: string;
    initials: string;
    date: string;
    amountUsd: number;
    transactionId?: string;
    memberId?: string;
  }[];
}
