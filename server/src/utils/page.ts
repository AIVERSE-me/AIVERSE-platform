export class PageData {
  page: number;
  pageSize: number;

  constructor(
    page: number,
    pageSize: number,
    {
      maxPageSize = 20,
      minPageSize = 0,
    }: { maxPageSize?: number; minPageSize?: number } = {},
  ) {
    this.page = Math.max(1, page);
    this.pageSize = Math.max(Math.min(pageSize, maxPageSize), minPageSize);
  }

  get offset(): number {
    return (this.page - 1) * this.pageSize;
  }
  get limit(): number {
    return this.pageSize;
  }
}

export class PageResult<T> {
  page: number;

  pageSize: number;

  data: T[];

  total: number;

  static empty<T>(): PageResult<T> {
    return { page: 0, pageSize: 0, data: [], total: 0 };
  }

  static from<T>(page: PageData, data: T[], total: number): PageResult<T> {
    return { page: page.page, pageSize: page.pageSize, data, total };
  }
}

export interface SecurePageDataOptions {
  defaultPageSize: number;
}

export function securePageData(
  { page, pageSize }: { page: number; pageSize: number },
  { defaultPageSize }: SecurePageDataOptions = { defaultPageSize: 20 },
): PageData {
  page = Math.max(1, page);
  pageSize = Math.max(Math.min(pageSize, defaultPageSize), 0);
  return new PageData(page, pageSize);
}
