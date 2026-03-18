export type OptionalProp<T, Prop extends string | number | symbol> = Omit<T, Prop> & Partial<T>
