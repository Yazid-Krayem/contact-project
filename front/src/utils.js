export const sleep = (ms) => new Promise( ok => setTimeout(ok, ms))
export const getRandomInteger = (max, min=0) => Math.floor(Math.random() * (max - min + 1)) + min
export const pause = () => sleep(getRandomInteger(1000,4000))

/**
 * Takes an object like 
 * ```
 * { name:'john', surname:'silver', guineas:400}
 * ```
 * and transforms it into a string like
 * ```
 * name=john&surname=silver&guineas=400
 * ```
 * This is a very simplistic function that will break on nested objects or arrays
 * @param {Object} params An Object containing all the keys
 * @returns {string} the query parameters string
 */
export const objectToQuery = params => {
  return Object.keys(params)
  .filter( key => params[key] !== undefined && params[key] !== null)
  .map( key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
  .join('&')
  .trim();
}

/**
 * creates a url string with a query object
 * For example:
 * ```
 * const url = makeRequestUrl('/stardust',{a:1,username:'ziggy'})
 * ```
 * url in this case will be: `/stardust?a=1&username=ziggy`
 * @param {String} path the path that you want to request
 * @param {Object} params an object of parameters 
 * @returns {string} the url
 */
export const makeRequestUrl = (path, params) => {
  if(!params){ return path }
  const query = objectToQuery(params)
  if(query.length){
    const has_interrogation_mark = path.indexOf('?') === 0 
    const url = path + (has_interrogation_mark ? '&' : '?') + query;
    return url
  }
  return path
}
