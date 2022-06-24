// TODO: I want to use a "structuredCopy".
const structuredCopy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
export default structuredCopy;
