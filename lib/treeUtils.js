import _ from "lodash";
const TreeKeyName = "key";
const TreeTitleName = "title";
const cloneDeep = _.cloneDeep;
//type IeachFn = (node, index, pnode) => boolean;

/**
 * 数组转对象
 * @param {*} arr
 * @param {*} key
 * @returns
 */
export const arr2map = (arr = [], key = "id") => {
  return arr.reduce((m, v) => ((m[v[key]] = v), m), {});
};
/**
 * 遍历树结构数据
 * @param tree
 * @param eachFn
 * @returns
 */
export const eachRecord = (tree, eachFn, pnode) => {
  if (tree && tree.length) {
    tree.forEach((item, index) => {
      if (item.children?.length) {
        eachRecord(item.children, eachFn, item);
      }
      eachFn(item, index, pnode);
    });
  }
  return tree;
};
/**
 * 遍历树结构数据
 * @param tree
 * @param eachFn 返回 真 退出
 * @returns
 */

export const someRecord = (tree, eachFn, pnode) => {
  if (tree && tree.length) {
    return tree.some((item, index) => {
      if (eachFn(item, index, pnode)) return !0;
      if (item.children?.length) {
        return someRecord(item.children, eachFn, item);
      }
      return !1;
    });
  }
  return false;
};
/**
 * 过虑搜索 树
 * @param tree
 * @param eachFn
 * @param includeParent
 * @returns
 */
export const filterRecord = (tree, eachFn, includeParent = true, pnode) => {
  if (tree && tree.length) {
    if (includeParent) {
      return cloneDeep(tree).filter((item, index) => {
        if (includeParent && item.children?.length) {
          const cs = filterRecord(item.children, eachFn, includeParent, pnode);
          item.children = cs;
          return !!cs.length;
        } else if (eachFn(item, index, pnode)) {
          return !0;
        }
        return !1;
      });
    } else {
      const nodes = [];
      eachRecord(tree, (node, idex, pn) => {
        if (eachFn(node, idex, pn)) nodes.push(node);
        return true;
      });
      return nodes;
    }
  }

  return [];
};

/**
 * 构造树形数据
 * @param treeData
 * @param pidName
 * @param idName
 * @param childrenName
 * @returns
 */
export const buildTreeData = (
  treeData = [],
  pidName = "parentId",
  idName = "id",
  childrenName = "children"
) => {
  //children   parentId
  //const  treeMap= arr2map(treeData),
  //const treeData2 = treeData.slice(0);
  const map = arr2map(treeData, idName),
    roots = [];
  const tranName = (v) => {
    v[TreeKeyName] = v[TreeKeyName] || v[idName];
    v[TreeTitleName] = v[TreeTitleName] || v.name;
    return v;
  };
  treeData.forEach((v) => {
    const pid = v[pidName],
      pNode = map[pid || ""];
    if (!pid) {
      roots.push(tranName(v));
    } else if (pNode) {
      if (!pNode[childrenName]) pNode[childrenName] = [];
      pNode[childrenName].push(tranName(v));
    }
  });

  //@ts-ignore
  roots._cacheNodeMap = map;
  return roots;
};
/**
 * tree节点拖拽调序，要求有parentId
 * @param {*} info
 * @param {*} treeData
 * @returns
 */
export const onTreeDrop2 = (info, treeData) => {
  const dropKey = info.node.key; //target
  const dragKey = info.dragNode.key; //src
  const nodeMap = {},
    eachNode = (nodes) => {
      nodes.forEach((v) => {
        nodeMap[v.key] = v;
        if (v.children) eachNode(v.children);
      });
    },
    rmKey = (vs = [], key) =>
      vs.some((v, i) => (v.key == key ? (vs.splice(i, 1), true) : false)),
    add = (vs, i, el, pid) => {
      vs.splice(i, 0, el);
      el.parentId = pid;
    };
  eachNode(treeData);
  let ar = [];
  if (!info.dropToGap) {
    if (info.node.isLeaf) return treeData;
    rmKey(nodeMap[info.dragNode.parentId].children, dragKey); // remove old
    ar = nodeMap[dropKey].children;
    if (!ar) ar = nodeMap[dropKey].children = [];
    add(ar, 0, nodeMap[dragKey], dropKey);
  } else {
    const dropParent = info.node.parentId,
      dragParent = info.dragNode.parentId;
    //return treeData;
    const tarIdx = info.dropPosition - 1;
    if (dropParent == dragParent) {
      //同级
      ar = nodeMap[dropParent].children;
      const idx = ar.findIndex((d) => d.key == dragKey);
      if (tarIdx == idx) return treeData;
      ar.splice(tarIdx + 1, 0, nodeMap[dragKey]);
      ar.splice(tarIdx > idx ? idx : idx + 1, 1);
    } else {
      add(
        nodeMap[dropParent].children,
        tarIdx + 1,
        nodeMap[dragKey],
        dropParent
      );
      rmKey(nodeMap[dragParent].children, dragKey);
    }
  }

  return treeData;
};

/**
 * tree节点拖拽
 * @param info
 * @param treeData
 * @returns {...*[]}
 */
/* export const onTreeDrop = (info, treeData, keyField = 'key') => {
  console.log('onTreeDrop', info);
  const dropKey = info.node.key;
  const dragKey = info.dragNode.key;
  const dropPos = info.node.pos.split('-');
  const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);

  console.log('dropKey', dropKey, 'dragKey', dragKey, dropPosition);

  const loop = (data, key, callback) => {
    for (let i = 0; i < data.length; i++) {
      if (data[i][keyField] === key) {
        return callback(data[i], i, data);
      }
      if (data[i].children) {
        loop(data[i].children, key, callback);
      }
    }
  };
  const data = [...treeData];

  // Find dragObject
  let dragObj;
  loop(data, dragKey, (item, index, arr) => {
    arr.splice(index, 1);
    dragObj = item;
  });

  if (!info.dropToGap) {
    // Drop on the content
    loop(data, dropKey, (item) => {
      item.children = item.children || [];
      // where to insert 示例添加到尾部，可以是随意位置
      item.children.push(dragObj);
    });
  } else if (
    (info.node.children || []).length > 0 && // Has children
    info.node.expanded && // Is expanded
    dropPosition === 1 // On the bottom gap
  ) {
    loop(data, dropKey, (item) => {
      item.children = item.children || [];
      // where to insert 示例添加到头部，可以是随意位置
      item.children.unshift(dragObj);
    });
  } else {
    let ar;
    let i;
    loop(data, dropKey, (item, index, arr) => {
      ar = arr;
      i = index;
    });
    if (dropPosition === -1) {
      ar.splice(i, 0, dragObj);
    } else {
      ar.splice(i + 1, 0, dragObj);
    }
  }
  return data;
}; */

/**
 * 查找树中指定记录
 * @param tree
 * @param validate
 * @returns
 */
export const findRecord = (tree = [], validate) => {
  let target;
  someRecord(tree, (item, index, pnode) => {
    if (validate(item, index, pnode)) {
      target = item;
      return true;
    }
    return false;
  });
  return target;
};
/**
 * 树中指定位置插入数据
 * @param {*} values
 * @param {*} tree
 * @param {*} validate
 * @param {*} position
 * @returns
 */
export const insertRecord = (values, tree, validate, position, addHead) => {
  return filterRecord(tree, (item, index = 0) => {
    if (validate(item, index)) {
      if (position === -1) {
        item.children = addHead
          ? [values, ...(item.children || [])]
          : [...(item.children || []), values]; // 添加子节点
      } else {
        tree.splice(index + position, 0, values);
      }
      return true;
    }
    return false;
  });

  /* 
  let target;
  if (tree.length) {
    tree.some((item, i) => {
      if (validate(item)) {
        if (position === -1) {
          item.children = addHead
            ? [values, ...(item.children || [])]
            : [...(item.children || []), values]; // 添加子节点
        } else {
          tree.splice(i + position, 0, values);
        }
        target = tree;
        return true;
      }
      if (item.children?.length) {
        item.children = insertRecord(values, item.children, validate, position);
        if (target) return true;
      }
    });
  }
  return tree; */
};
/**
 * 移除树中指定记录
 * @param key
 * @param tree
 * @param leaveChildren 是否保留子节点
 * @param keyField
 * @returns {Array}
 */
export const removeRecord = (key, tree, leaveChildren, keyField = "key") => {
  if (tree.length) {
    tree.some((item, index) => {
      if (item[keyField] === key) {
        if (leaveChildren && item.children?.length) {
          tree.splice(index, 1, ...item.children);
        } else {
          tree.splice(index, 1);
        }
      } else if (item.children?.length) {
        removeRecord(key, item.children, leaveChildren, keyField);
      }
    });
  }
  return tree;
};
/**
 * 修改树中指定记录
 * @param values
 * @param tree
 * @param keyField
 * @returns {Array}
 */
export const editRecord = (values, tree, keyField = "key") => {
  if (tree.length) {
    tree.some((item, index) => {
      if (item[keyField] === values[keyField]) {
        tree[index] = values;
      } else if (item.children?.length) {
        editRecord(values, item.children, keyField);
      }
    });
  }
  return tree;
};

/**
 * 获取默认展开所有行key
 * @param tree
 * @param keys
 * @param keyField
 * @returns {Array}
 */
export const getExpandedRowKeys = (tree = [], keys = [], keyField = "key") => {
  tree.map((item) => {
    if (item.children?.length) {
      keys.push(item[keyField]);
      getExpandedRowKeys(item.children, keys, keyField);
    }
  });
  return keys;
};

/**
 * 拼接全路径名称
 * @param treeInfo
 * @param key 当前节点Key
 * @param attrib 拼接属性名
 * @param sub  分隔符
 * @returns {Array}
 *
 */
export const pathNames = (
  treeInfo,
  key,
  keyAttrName = "key",
  captionAttrName = "title",
  sub = "/"
) => {
  if (treeInfo.keyEntities) {
    const {
      keyEntities: { [key]: { nodes = [] } = {} },
    } = treeInfo;
    if (!key || !nodes.length) return "";
    return nodes.map((node) => node[captionAttrName]).join(sub);
  }
  const rs = filterRecord(treeInfo, (node) => {
    return node[keyAttrName] == key;
  });
  const ns = [];
  eachRecord(rs.slice(0, 1), (node) => {
    ns.push(node[captionAttrName]);
    return true;
  });
  ns.reverse();
  return ns.join(sub);
};
