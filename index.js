// const reg = /(\=|\s+\=\s+|\s+\=|\=\s+)/g
// const str = '--port=8080';
// const res = reg.exec(str)
// console.log(res)


// const l = console;

// console.log(`typeof console.log ${typeof l.log}`)
// console.log(`typeof console.debug ${typeof l.debug}`)
// console.log(`typeof console.info ${typeof l.info}`)
// console.log(`typeof console.warn ${typeof l.warn}`)
// console.log(`typeof console.error ${typeof l.error}`)
// if (
//   typeof l.debug !== 'function' ||
//   typeof l.error !== 'function' ||
//   typeof l.info !== 'function' ||
//   typeof l.log !== 'function' ||
//   typeof l.warn !== 'function'
// ) {
//   console.log('console is NOT an ILogger')
// } else {
//   console.log('console IS an ILogger')
// }

// const falseStr = 'false';
// const trueStr = 'true';

// console.log({ falseStr, res: Boolean(falseStr) });
// console.log({ trueStr, res: Boolean(trueStr) });
// console.log({ none: undefined, res: Boolean(undefined) });


const typeOfString = String instanceof Object;
const typeOfBoolean = Boolean instanceof Object;
const typeOfNumber = Number instanceof Object;

console.log({ typeOfString, typeOfBoolean, typeOfNumber })
