export const sleep = (ms) => new Promise( ok => setTimeout(ok, ms))
export const getRandomInteger = (max, min=0) => Math.floor(Math.random() * (max - min + 1)) + min
export const pause = () => sleep(getRandomInteger(1000,4000))
