import type { ICqrsxContext } from './interface';

export type TNext<TResult = unknown> = () => Promise<TResult>;

export interface IMiddlewareParams<TResult = unknown> {
  readonly next: TNext<TResult>;
  readonly context: ICqrsxContext;
}

export interface IMiddleware<TResult = unknown> {
  exec(params: IMiddlewareParams<TResult>): Promise<TResult>;
}

export type TMiddlewareFunction<TResult = unknown> = (
  params: IMiddlewareParams<TResult>,
) => Promise<TResult>;

export type TMiddleware<TResult = unknown> =
  | IMiddleware<TResult>
  | TMiddlewareFunction<TResult>;
