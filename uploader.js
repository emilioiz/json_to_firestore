var admin = require('firebase-admin')

var serviceAccount = require('./service_key.json')

const Bottleneck = require('bottleneck')
const limiter = new Bottleneck({
  maxConcurrent: 500,
  minTime: 2
})

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const firestore = admin.firestore()
const path = require('path')
const fs = require('fs')
const directoryPath = path.join(__dirname, 'files')

fs.readdir(directoryPath, function (err, files) {
  if (err) {
    return console.log('Unable to scan directory: ' + err)
  }

  files.forEach(function (file) {
    var lastDotIndex = file.lastIndexOf('.')

    var menu = require('./files/' + file)

    menu.forEach(function (obj) {
      limiter.schedule(() => {
        const docId = obj.locationId
        const doc = {
          name: obj.name,
          zipCode: obj.zipCode,
          lat: obj.lat,
          lng: obj.lng
        }

        firestore
          .collection(file.substring(0, lastDotIndex))
          .doc(docId)
          .set(doc)
          .then(function (docRef) {
            console.log(`${docId} - Document written`)
          })
          .catch(function (error) {
            console.error('Error adding document: ', error)
          })
      })
    })
  })
})
