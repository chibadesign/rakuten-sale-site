import React, { useEffect } from "react";
import { FilterBar } from "./FilterBar";
import { FilterState } from "../types";

export const ProductSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl shadow overflow-hidden animate-pulse">
    <div className="bg-red-50 aspect-square" />
    <div className="p-3 flex flex-col gap-2">
      <div className="h-3 bg-red-50 rounded w-1/3" />
      <div className="h-3 bg-red-50 rounded w-full" />
      <div className="h-3 bg-red-50 rounded w-3/4" />
      <div className="h-6 bg-red-50 rounded-full mt-2" />
    </div>
  </div>
);

export const SkeletonGrid: React.FC = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
    {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
  </div>
);

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filter: FilterState;
  onChange: (f: FilterState) => void;
  totalCount: number;
  filteredCount: number;
}

export const MobileFilterDrawer: React.FC<DrawerProps> = ({ isOpen, onClose, filter, onChange, totalCount, filteredCount }) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[28px] z-50 max-h-[85vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 bg-red-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-b border-red-100">
          <span className="text-base font-semibold text-gray-800">絞り込み</span>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <FilterBar filter={filter} onChange={onChange} totalCount={totalCount} filteredCount={filteredCount} />
        </div>
        <div className="sticky bottom-0 bg-white border-t border-red-100 p-4">
          <button onClick={onClose}
            className="w-full bg-[#BF0000] text-white font-semibold py-3 rounded-full text-base">
            {filteredCount}件を表示
          </button>
        </div>
      </div>
    </>
  );
};
