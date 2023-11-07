/**
 *
 * @param {any} data
 * @param {string} template
 * @returns
 */
export default (data, template) => {
  /**
   * data 数据格式:
   * {
   * appName:'应用名称',
   * pages:[{id:'',parent:'',children:[]}] //树对象 ，
   * }
   * 遍历树结构函数： $fn.buildTreeData(datas, pidName='parentId', idName='id', childrenName='children' )
   * 遍历树结构函数： $fn.eachRecord(datas,(item,index,parentNode)=>true )
   * 过虑树结构函数： $fn.filterRecord(datas,(item,index,parentNode)=>true )
   * arrayMap 转 keyMap  $fn.arr2map(array, keyName )
   * 生成JSON函数： $fn.json(datas,(item,index,parentNode)=>true )
   * 生成JSON并格式化构函数： $fn.jsonFmt(datas,(item,index,parentNode)=>true )
   * 模板解析函数：$T.compile(template)(data)
   * */
  const groupBaseHeight = 7, //组基础高度
    groupBeginTop = 0, //组开始Y位置
    groupTopSpan = 1, //组上下间格
    groupLeft = 0, //组左边位置
    groupRight = 64, //组右边位置
    itemBeginLeft = 1, //子项左边开始位置
    itemBeginTop = 6, //子项Y边开始位置
    itemHeight = 5,
    colCount = 3; //分栏数
  const itemWidth = ((groupRight - groupLeft - itemBeginLeft) / colCount) >> 0;
  data.pages = $fn.filterRecord(data.pages, (node, i, pnode) =>
    node.typed !== null ? true : !!node.children.length
  );
  console.log("data", data);
  const result = $T.compile(template)(data);
  console.log("result", result);
  return result;
};
