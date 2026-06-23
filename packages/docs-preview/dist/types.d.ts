export interface GitInfo {
  branch: string;
  description: string;
}

export interface ChangeEvent {
  type: "change";
  path: string;
}

export interface DocTreeNode {
  title: string;
  href?: string;
  exact?: boolean;
  children?: DocTreeNode[];
}
