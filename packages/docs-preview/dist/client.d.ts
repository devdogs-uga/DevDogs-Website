import type { ChangeEvent, DocTreeNode, GitInfo } from "./types";
export type { ChangeEvent, DocTreeNode, GitInfo };
export declare const PREVIEW_PORT = 4987;
export declare const PREVIEW_URL = "http://localhost:4987";
export declare const PREVIEW_WS_URL = "ws://localhost:4987/ws";
export declare function fetchTree(): Promise<DocTreeNode[]>;
export declare function fetchGitInfo(): Promise<GitInfo>;
export declare function checkPreviewServer(): Promise<boolean>;
export declare function fetchFile(filePath: string): Promise<string | null>;
export declare function connectPreviewSocket(
  onEvent: (event: ChangeEvent) => void,
): () => void;
