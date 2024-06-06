let express = require('express')
let app = express()

app.use(express.json())

let {open} = require('sqlite')
let sqlite3 = require('sqlite3')
let path = require('path')
let bcrypt = require('bcrypt')

let dbPath = path.join(__dirname, 'userData.db')

let db = null

let initalizeDbandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Started')
    })
  } catch (e) {
    console.log(`Error: "${e.message}"`)
  }
}

module.exports = app

initalizeDbandServer()

// API 1

app.post('/register', async (request, response) => {
  let {username, name, password, gender, location} = request.body
  let hashedPassword = await bcrypt.hash(password, 10)
  if (password.length < 5) {
    // Scenario 2
    response.status(400)
    response.send('Password is too short')
  } else {
    const checkUserQuery = `SELECT * FROM user WHERE username = "${username}";`
    let checkUser = await db.get(checkUserQuery)
    if (checkUser === undefined) {
      // 200
      const addUserQuery = `INSERT INTO user VALUES ("${username}","${name}","${hashedPassword}","${gender}","${location}");`
      await db.run(addUserQuery)
      response.send('User created successfully')
    } else {
      // 400
      response.status(400)
      response.send("User already exists")
    }
  }
})

// API 2

app.post('/login', async (request, response) => {
  let {username, password} = request.body
  const checkUserInfoQuery = `SELECT * FROM user WHERE username = "${username}";`
  let checkUserInfo = await db.get(checkUserInfoQuery)

  if (checkUserInfo === undefined) {
    // 400
    response.status(400)
    response.send('Invalid user')
  } else {
    let isPasswordTrue = await bcrypt.compare(password, checkUserInfo.password)
    if (isPasswordTrue === true) {
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

//API 3

app.put('/change-password', async (request, response) => {
  let {username, oldPassword, newPassword} = request.body
  if (newPassword.length < 5) {
    response.status(400)
    response.send('Password is too short')
  } else {
    const checkUserInfoQuery = `SELECT * FROM user WHERE username = "${username}";`
    let checkUserInfo = await db.get(checkUserInfoQuery)
    if (checkUserInfo === undefined) {
      // 400
      response.status(400)
      response.send('User not found')
    } else {
      let checkPassword = await bcrypt.compare(
        oldPassword,
        checkUserInfo.password,
      )
      if (checkPassword === true) {
        // 200

        let newPasswordEncrypt = await bcrypt.hash(newPassword, 10)
        const updatePasswordQuery = `UPDATE user SET password = "${newPasswordEncrypt}" where username = "${username}";`
        await db.run(updatePasswordQuery)
        response.send('Password updated')
      } else {
        // 400

        response.status(400)
        response.send('Invalid current password')
      }
    }
  }
})
