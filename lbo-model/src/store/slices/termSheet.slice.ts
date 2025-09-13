/**
 * Term Sheet Slice
 * 管理條款清單狀態 - Linus 品味：簡潔統一，無特殊情況
 * 條款數據由 selectors 從其他 slices 生成
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TermSheetState, TermClause, TermSheetSection } from '../../types/termSheet';

// 初始狀態 - 簡潔乾淨
const initialState: TermSheetState = {
  clauses: {},
  meta: {
    version: '1.0',
    status: 'draft',
    lastUpdated: new Date().toISOString(),
    confidential: true,
  },
  editMode: 'view',
  selectedSection: undefined,
};

// Slice 定義 - 遵循統一處理原則
export const termSheetSlice = createSlice({
  name: 'termSheet',
  initialState,
  reducers: {
    // 批量設置條款 - 統一入口，避免特殊情況
    setClauses: (state, action: PayloadAction<Record<string, TermClause>>) => {
      state.clauses = action.payload;
      state.meta.lastUpdated = new Date().toISOString();
    },

    // 更新單一條款
    updateClause: (state, action: PayloadAction<TermClause>) => {
      const clause = action.payload;
      state.clauses[clause.id] = clause;
      state.meta.lastUpdated = new Date().toISOString();
    },

    // 更新條款內容 - 僅可編輯的條款
    updateClauseContent: (state, action: PayloadAction<{
      id: string;
      content: string | number;
    }>) => {
      const { id, content } = action.payload;
      const clause = state.clauses[id];
      
      if (clause && clause.isEditable) {
        clause.content = content;
        state.meta.lastUpdated = new Date().toISOString();
      }
    },

    // 設置編輯模式
    setEditMode: (state, action: PayloadAction<'view' | 'edit' | 'review'>) => {
      state.editMode = action.payload;
    },

    // 選擇章節
    selectSection: (state, action: PayloadAction<TermSheetSection | undefined>) => {
      state.selectedSection = action.payload;
    },

    // 更新元數據
    updateMeta: (state, action: PayloadAction<Partial<TermSheetState['meta']>>) => {
      Object.assign(state.meta, action.payload);
      state.meta.lastUpdated = new Date().toISOString();
    },

    // 重新生成所有條款 - 觸發 selectors 重新計算
    regenerateClauses: (state) => {
      // 只更新時間戳，實際重新生成由 selectors 處理
      state.meta.lastUpdated = new Date().toISOString();
    },

    // 重置為初始狀態
    resetTermSheet: () => initialState,
  },
});

// 導出 actions
export const {
  setClauses,
  updateClause,
  updateClauseContent,
  setEditMode,
  selectSection,
  updateMeta,
  regenerateClauses,
  resetTermSheet,
} = termSheetSlice.actions;

// 導出 reducer
export default termSheetSlice.reducer;

// 基礎 selectors
export const selectTermSheetState = (state: { termSheet: TermSheetState }) => state.termSheet;
export const selectClauses = (state: { termSheet: TermSheetState }) => state.termSheet.clauses;
export const selectTermSheetMeta = (state: { termSheet: TermSheetState }) => state.termSheet.meta;
export const selectEditMode = (state: { termSheet: TermSheetState }) => state.termSheet.editMode;
export const selectSelectedSection = (state: { termSheet: TermSheetState }) => state.termSheet.selectedSection;

// 便利 selectors
export const selectClausesBySection = (state: { termSheet: TermSheetState }, section: TermSheetSection) =>
  Object.values(state.termSheet.clauses)
    .filter(clause => clause.section === section)
    .sort((a, b) => a.displayOrder - b.displayOrder);

export const selectEditableClauses = (state: { termSheet: TermSheetState }) =>
  Object.values(state.termSheet.clauses).filter(clause => clause.isEditable);

export const selectGeneratedClauses = (state: { termSheet: TermSheetState }) =>
  Object.values(state.termSheet.clauses).filter(clause => clause.isGenerated);