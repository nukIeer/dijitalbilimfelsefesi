import fs from 'fs';

async function fetchAndAnalyze() {
    const res = await fetch('https://raw.githubusercontent.com/nukIeer/makaleler/refs/heads/main/1.json');
    const data = await res.json();
    
    console.log("Keys:", Object.keys(data));
    if (Object.keys(data).includes("makaleler")) {
        console.log("makaleler shape:", data.makaleler[0]);
    }
    if (Object.keys(data).includes("global_analizler")) {
        console.log("global_analizler shape:", Object.keys(data.global_analizler));
        
        if (data.global_analizler.metin_analizi) {
            console.log("metin_analizi snippet:", data.global_analizler.metin_analizi.slice(0, 2));
        }
        if (data.global_analizler.network_analizi) {
            console.log("network node sample:", data.global_analizler.network_analizi.nodes[0]);
            console.log("network edge sample:", data.global_analizler.network_analizi.edges?.[0]);
        }
        if (data.global_analizler.mekanlar) {
             console.log("mekanlar example:", data.global_analizler.mekanlar[0]);
        }
    }
}
fetchAndAnalyze();
