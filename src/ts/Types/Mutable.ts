/**
 * Removes 'readonly' attributes from a type's properties.
 *
 * This includes `get` only accessors.
 */
export type CreateMutable<Type> = {
    -readonly [Property in keyof Type]: Type[Property];
};
