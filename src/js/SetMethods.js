export const leftDifference = (leftSet, rightSet) => {
    const _difference = new Set(leftSet);
    for (const element of rightSet) {
        _difference.delete(element);
    }
    return _difference;
};

export const intersection = (leftSet, rightSet) => {
    const _intersection = new Set();
    for (const element of rightSet) {
        if (leftSet.has(element)) {
            _intersection.add(element)
        }
    }
    return _intersection;
};
