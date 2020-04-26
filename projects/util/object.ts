export function overrideDefinedProperties<T extends object, U extends object>(initial: T, override: U): T & Partial<U> {
    const starter: T & Partial<U> = {...initial};
    return getObjectTypedKeys(override)
        .filter(key => override[key] != undefined)
        .reduce((accum, key) => {
            const newValue = override[key] as any;
            if (typeof newValue === 'object' && typeof accum[key] === 'object') {
                accum[key] = overrideDefinedProperties(accum[key] as any, newValue);
            } else {
                accum[key] = override[key] as any;
            }
            return accum;
        }, starter);
}

export function getObjectTypedKeys<T extends object>(input: T): (keyof T)[] {
    return Object.keys(input) as (keyof T)[];
}

export function getEnumTypedKeys<T extends object>(input: T): (keyof T)[] {
    // keys are always strings
    return getObjectTypedKeys(input).filter(key => isNaN(Number(key))) as (keyof T)[];
}

export function getEnumTypedValues<T extends object>(input: T): T[keyof T][] {
    const keys = getEnumTypedKeys(input);
    return keys.map(key => input[key]);
}

export
function isKeyInEnum<T extends object>(checkEnum: T, key: any): key is keyof T {
    if (typeof key === 'string') {
        return getEnumTypedKeys(checkEnum).includes(key as any);
    }
    return false;
}

export
function isValueInEnum<T extends object>(checkEnum: T, value: any): value is T {
    return value != undefined && getEnumTypedValues(checkEnum).includes(value);
}
