/** What the user picked. `id` is a region id, or null for bytes no region explains (then `offset` says which byte). */
export type Sel = {
  id: string | null;
  offset: number | null;
  /** Where the pick came from. A byte click does not scroll the hex view. */
  from: 'byte' | 'row' | 'list' | 'auto';
  /** True when the pick came from the keyboard: focus then moves to the inspector card. */
  focus: boolean;
};
