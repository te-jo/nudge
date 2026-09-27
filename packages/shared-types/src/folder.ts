/**
 * A container for grouping tasks — nothing more. A task belongs to at most
 * one folder, and deleting a folder leaves its tasks intact but unassigned.
 */
export interface Folder {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFolderInput {
  name: string;
}

export interface UpdateFolderInput {
  name?: string;
}
