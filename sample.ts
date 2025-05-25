import { useCallback, useMemo } from "react";
import { useFilterPilot, useNextJsPagesUrlHandler } from "@matthew.ngo/react-filter-pilot";
import { PAGE_SIZE } from "@/_configs/api";
import {
  ApprovalRequestBasicInfo,
  ApprovalRequestFilterByStatus,
  ApprovalStateType,
} from "@/_types/document";
import { formatISODate } from "@/_utils/time";

interface ApprovalRequestFilters {
  title: string;
  status: ApprovalRequestFilterByStatus | null;
  startDate: string | null;
  endDate: string | null;
  creatorId: string | null;
  yourTurn: boolean;
}

export const useApprovalRequestFilterPilot = (
  isAdminApproval: boolean,
  yourTurn: boolean,
  fetchPagedApprovalRequest: (params: any) => Promise<any>
) => {
  const fetchData = useCallback(
    async ({ filters, pagination, sort }) => {
      const {
        title,
        status,
        startDate,
        endDate,
        creatorId,
        yourTurn: filterYourTurn,
      } = filters;

      const dateRange =
        startDate && endDate
          ? formatISODate(startDate, "YYYY-MM-DD") +
            ":" +
            formatISODate(endDate, "YYYY-MM-DD")
          : undefined;

      const result = await fetchPagedApprovalRequest({
        pageIndex: pagination.page,
        pageSize: pagination.pageSize,
        status,
        title,
        dateRange,
        yourTurn: filterYourTurn,
        creatorId,
      });

      return {
        data: result?.data || [],
        totalRecords: result?.total || 0,
      };
    },
    [fetchPagedApprovalRequest]
  );

  // Sử dụng Next.js Pages Router URL handler
  const urlHandler = useNextJsPagesUrlHandler();

  const filterPilot = useFilterPilot<
    ApprovalRequestBasicInfo,
    ApprovalRequestFilters
  >({
    filterConfigs: [
      {
        name: "title",
        defaultValue: "",
        debounceMs: 300,
        urlKey: "q",
      },
      {
        name: "status",
        defaultValue: null,
        urlKey: "status",
      },
      {
        name: "startDate",
        defaultValue: null,
        urlKey: "startDate",
      },
      {
        name: "endDate",
        defaultValue: null,
        urlKey: "endDate",
      },
      {
        name: "creatorId",
        defaultValue: null,
        urlKey: "creator",
      },
      {
        name: "yourTurn",
        defaultValue: yourTurn,
      },
    ],
    paginationConfig: {
      initialPageSize: PAGE_SIZE,
      pageSizeOptions: [10, 20, 50],
      resetOnFilterChange: true,
    },
    fetchConfig: {
      fetchFn: fetchData,
      staleTime: 5 * 60 * 1000, // 5 phút
      gcTime: 10 * 60 * 1000, // 10 phút
    },
    // Truyền URL handler cho Next.js
    urlHandler: urlHandler,
  });

  return {
    ...filterPilot,
    pagination: {
      pageIndex: filterPilot.pagination.page - 1,
      pageSize: filterPilot.pagination.pageSize,
    },
    setPagination: (newPagination: { pageIndex: number; pageSize: number }) => {
      filterPilot.setPage(newPagination.pageIndex + 1);
      filterPilot.setPageSize(newPagination.pageSize);
    },
    bulkUpdateFilter: (values: Partial<ApprovalRequestFilters>) => {
      filterPilot.setFilters(values);
    },
  };
};
