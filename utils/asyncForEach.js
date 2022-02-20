

module.exports.asyncForEach = async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}


module.exports.asyncCollectionForEach = async function asyncForEach(array, callback) {
  for (let index = 0; index < array.size; index++) {
    await callback(array.at(index), index, array);
  }
}