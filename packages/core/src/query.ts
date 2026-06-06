export abstract class Query<TResult = unknown> {
  static readonly __cqrsxKind = 'query';
  readonly __resultType!: TResult;
}

export interface IQueryHandler<T extends Query<unknown>, TResult = unknown> {
  exec(query: T): Promise<TResult>;
}
