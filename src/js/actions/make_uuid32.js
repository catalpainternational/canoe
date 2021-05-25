export function make_uuid32() {
    // make a uuid string hyphens-removed (fastest benchmark: http://jsben.ch/Lbxoe)
    var u = '';
    var i = 0;
    while (i++ < 32) {
      var c='xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'[i-1],r=Math.random()*16|0,v=c=='x'?r:(r&0x3|0x8);
      u += (c=='-'||c=='4')?c:v.toString(16);
    }
    return u;
}
