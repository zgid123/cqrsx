import type { Command } from './command';
import type { TConstructor } from './interface';
import type { Query } from './query';

export function isCommandClass(
  messageClass: TConstructor<unknown>,
): messageClass is TConstructor<Command> {
  return (
    '__cqrsxKind' in messageClass && messageClass.__cqrsxKind === 'command'
  );
}

export function isQueryClass(
  messageClass: TConstructor<unknown>,
): messageClass is TConstructor<Query<unknown>> {
  return '__cqrsxKind' in messageClass && messageClass.__cqrsxKind === 'query';
}
