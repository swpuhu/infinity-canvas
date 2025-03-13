import SNode from '@/renderer/SNode';
import { Pool } from './Pool';

export const nodePool = new Pool(10, SNode, (node) => {
    node.reset();
});
