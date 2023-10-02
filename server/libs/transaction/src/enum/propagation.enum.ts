export enum Propagation {
  // If a transaction exists, execute within that transaction. Otherwise, execute a new transaction.
  REQUIRED = 'REQUIRED',
  // If a transaction exists, execute within that transaction. Otherwise, run without a transaction.
  SUPPORTS = 'SUPPORTS',
  // If a transaction exists, execute within that transaction. Otherwise, throw an exception.
  MANDATORY = 'MANDATORY',
  // Create a new transaction, and suspend the current transaction if one exists.
  REQUIRES_NEW = 'REQUIRES_NEW',
  // Execute non-transactionally, suspend the current transaction if one exists.
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  // Execute non-transactionally, throw an exception if a transaction exists.
  NEVER = 'NEVER',
  // Executed within a nested transaction if a current transaction exists, behave like REQUIRED otherwise.
  NESTED = 'NESTED',
}
