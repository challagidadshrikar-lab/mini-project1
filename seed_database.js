// This is a Node.js script to help you seed your Firestore database.
// You need to install Firebase Admin SDK to run this script:
// npm init -y
// npm install firebase-admin
//
// Then, download your service account key from the Firebase Console
// (Project Settings > Service Accounts > Generate new private key)
// and save it as "serviceAccountKey.json" in this folder.
// Finally, run: node seed_database.js

const admin = require("firebase-admin");
const fs = require('fs');

// Check if serviceAccountKey.json exists
if (!fs.existsSync('./serviceAccountKey.json')) {
    console.error("Error: serviceAccountKey.json not found!");
    console.error("Please download it from Firebase Console -> Project Settings -> Service Accounts.");
    process.exit(1);
}

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const seedData = [
    {
        name: "Powdery Mildew",
        medications: [
            "Apply a fungicide containing potassium bicarbonate or neem oil.",
            "Use sulfur-based plant fungicides."
        ],
        environmental: [
            "Reduce humidity by improving air circulation around the plant.",
            "Water the plant at the base to keep foliage dry.",
            "Ensure the plant gets sufficient sunlight."
        ]
    },
    {
        name: "Tomato Blight",
        medications: [
            "Apply copper-based fungicides immediately.",
            "Remove and destroy all affected leaves and stems."
        ],
        environmental: [
            "Avoid overhead watering; use drip irrigation.",
            "Rotate crops annually.",
            "Ensure adequate spacing between plants for airflow."
        ]
    },
    {
        name: "Aphids Infestation",
        medications: [
            "Spray with insecticidal soap or neem oil.",
            "Introduce natural predators like ladybugs."
        ],
        environmental: [
            "Avoid over-fertilizing with nitrogen, which attracts aphids.",
            "Regularly inspect new growth."
        ]
    },
    {
        name: "Healthy",
        medications: [
            "No medications needed."
        ],
        environmental: [
            "Continue your current watering and fertilizing schedule.",
            "Maintain adequate sunlight."
        ]
    }
];

async function seed() {
    console.log("Starting database seeding...");
    const diseasesRef = db.collection("diseases");

    for (const disease of seedData) {
        try {
            await diseasesRef.add(disease);
            console.log(`Successfully added: ${disease.name}`);
        } catch (error) {
            console.error(`Error adding ${disease.name}:`, error);
        }
    }
    console.log("Database seeding completed!");
}

seed();