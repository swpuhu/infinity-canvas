import SNode from './SNode';

export function serialize(node: SNode): string {}

function serializeRecursive(node: SNode): string {}

export function deserialize(data: string): SNode {
    return JSON.parse(data);
}
