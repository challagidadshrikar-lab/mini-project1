import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getVertexAI, getGenerativeModel } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-vertexai-web.js";

// TODO: Replace this with your actual Firebase config object from the Firebase Console
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Initialize Firebase AI Logic (Gemini API)
const vertexAI = getVertexAI(app);
const model = getGenerativeModel(vertexAI, { model: "gemini-flash-latest" });
// Note: We use gemini-flash-latest as it supports multimodal (image + text) fast.

// DOM Elements
const form = document.getElementById('diseaseForm');
const imageInput = document.getElementById('plantImage');
const imagePreview = document.getElementById('imagePreview');
const descriptionInput = document.getElementById('plantDescription');
const submitBtn = document.getElementById('submitBtn');
const loading = document.getElementById('loading');
const resultsCard = document.getElementById('results');
const inputCard = document.getElementById('input-card');
const resetBtn = document.getElementById('resetBtn');

// Result Elements
const diseaseNameEl = document.getElementById('diseaseName');
const geminiAnalysisEl = document.getElementById('geminiAnalysis');
const medicationsList = document.getElementById('medicationsList');
const environmentList = document.getElementById('environmentList');

// Show Image Preview
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            imagePreview.src = event.target.result;
            imagePreview.style.display = 'block';
        }
        reader.readAsDataURL(file);
    } else {
        imagePreview.style.display = 'none';
    }
});

// Reset Form
resetBtn.addEventListener('click', () => {
    form.reset();
    imagePreview.style.display = 'none';
    resultsCard.style.display = 'none';
    inputCard.style.display = 'block';
});

// Helper function to convert File object to Generative Part for Gemini
async function fileToGenerativePart(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve({
            inlineData: {
                data: reader.result.split(',')[1],
                mimeType: file.type
            }
        });
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Form Submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const file = imageInput.files[0];
    if (!file) return;

    // UI Updates
    submitBtn.disabled = true;
    loading.style.display = 'block';
    resultsCard.style.display = 'none';

    try {
        // 1. Prepare image for Gemini
        const imagePart = await fileToGenerativePart(file);

        // 2. Prepare the prompt for Gemini
        const userNotes = descriptionInput.value.trim();
        const prompt = `
            You are an expert plant pathologist. Examine this plant image.
            User Notes: ${userNotes ? userNotes : "None provided."}
            Identify the disease affecting the plant.
            Respond strictly in the following JSON format:
            {
                "diseaseName": "Short standard name of the disease (e.g. Powdery Mildew, Healthy)",
                "analysis": "A brief explanation of why you think this is the case based on visual symptoms."
            }
        `;

        // 3. Call Gemini to analyze the image
        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();

        // Parse Gemini JSON response (handling potential markdown formatting)
        let cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const aiData = JSON.parse(cleanJson);
        const detectedDisease = aiData.diseaseName;

        // 4. Update UI with AI findings
        diseaseNameEl.textContent = detectedDisease;
        geminiAnalysisEl.textContent = aiData.analysis;

        // 5. Query Firestore for Advisory Data
        await fetchAdvisoryData(detectedDisease);

        // Show Results
        inputCard.style.display = 'none';
        resultsCard.style.display = 'block';

    } catch (error) {
        console.error("Error analyzing plant:", error);
        alert("There was an error analyzing the plant. Please check console for details. Ensure you have added your Firebase config in app.js.");
    } finally {
        submitBtn.disabled = false;
        loading.style.display = 'none';
    }
});

async function fetchAdvisoryData(diseaseName) {
    medicationsList.innerHTML = '';
    environmentList.innerHTML = '';

    try {
        const diseasesRef = collection(db, "diseases");
        // We do a case-insensitive-like approach or just query exactly.
        // In a real app, you might use a generic ID or vector search.
        // Here we query where 'name' == detectedDisease.
        const q = query(diseasesRef, where("name", "==", diseaseName));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
                const data = doc.data();

                // Populate Medications
                if (data.medications && data.medications.length > 0) {
                    data.medications.forEach(med => {
                        const li = document.createElement('li');
                        li.textContent = med;
                        medicationsList.appendChild(li);
                    });
                } else {
                    medicationsList.innerHTML = '<li>No specific medications required or known.</li>';
                }

                // Populate Environmental Requirements
                if (data.environmental && data.environmental.length > 0) {
                    data.environmental.forEach(env => {
                        const li = document.createElement('li');
                        li.textContent = env;
                        environmentList.appendChild(li);
                    });
                } else {
                    environmentList.innerHTML = '<li>No specific environmental changes required.</li>';
                }
            });
        } else {
            medicationsList.innerHTML = '<li>No treatment data found in database for this specific disease.</li>';
            environmentList.innerHTML = '<li>Please consult a local agricultural expert.</li>';
        }
    } catch (error) {
        console.error("Error fetching Firestore data:", error);
        medicationsList.innerHTML = '<li style="color:red;">Error connecting to database.</li>';
        environmentList.innerHTML = '<li style="color:red;">Error connecting to database.</li>';
    }
}
