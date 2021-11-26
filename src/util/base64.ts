// https://stackoverflow.com/questions/6213227/fastest-way-to-convert-a-number-to-radix-64-in-javascript
// modified for typescript/general modernization/aesthetics/etc

export const Base64 = {
  _Rixits: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_',

  // This cannot handle negative numbers and only works on the integer part,
  // discarding the fractional part. Doing better means deciding on whether
  // you're just representing the subset of javascript numbers of
  // twos-complement 32-bit integers or going with base-64 representations for
  // the bit pattern of the underlying IEEE floating-point number, or
  // representing the mantissae and exponents separately, or some other
  // possibility. For now, bail
  fromNumber: function(number: number): string {
    if (isNaN(number) || number === null || number === Number.POSITIVE_INFINITY || number < 0) {
      throw 'invalid input';
    }

    let rixit; // like 'digit', only in some non-decimal radix
    number = Math.floor(number);
    let result = '';
    for (;;) {
      rixit = number % 64;
      result = this._Rixits.charAt(rixit) + result;
      number = Math.floor(number / 64);

      if (number == 0) { break; }
    }
    return result;
  },

  toNumber: function(string: string): number {
    let result = 0;
    const rixits = string.split('');
    for (let e = 0; e < rixits.length; e++) {
      result = (result * 64) + this._Rixits.indexOf(rixits[e]);
    }
    return result;
  }
};
