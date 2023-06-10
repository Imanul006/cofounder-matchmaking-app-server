const bcrypt = require("bcryptjs");
const https = require("https");

async function encrypt(inputPassword) {
  let encryptedPassword = await bcrypt.hash(inputPassword, 8);
  return encryptedPassword;
}

async function compareEncrypt(dbPassword, inputPassword) {
  // Setting "9716" as a master OTP for development purpose
  if (inputPassword === "9716") return true 
 
  try { 
    const result = await bcrypt.compare(inputPassword, dbPassword);
    return result;
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
}

async function sendOtp(phone) {
  var otp = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
  var phoneNumber = phone.toString();
  console.log(phoneNumber);
  const data = JSON.stringify({
    route : "v3",
    sender_id : "FTWSMS",
    message : otp + " is OTP for your Nearify login",
    language : "english",
    flash : 0,
    numbers : phoneNumber,
  });

  const options = {
    hostname: 'www.fast2sms.com',
    port: 443,
    path: '/dev/bulkV2',
    method: 'POST',
    headers: {
        "authorization":"xTu4YiwI8lvyZckpF2XbjMDAtfOP51sLV6omHn0WE7zBKe9NgUeVjsHw21RPLqO8g07WUJc3AkSFXhly", 
        "Content-Type": "application/json",
    }
  }

  const req = await https.request(options, res => {
    console.log(`statusCode: ${res.statusCode}`)
  
    res.on('data', d => {
      process.stdout.write(d)
    })
  })
  
  req.on('error', error => {
    console.error(error)
    return null;
  })
  
  await req.write(data)
  await req.end()
  return otp;
}

module.exports = { encrypt, compareEncrypt, sendOtp };
