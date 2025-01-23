/******************************************************************
 * BioInfo - Client-Side Bioinformatics App
 *  - FASTA (DNA/Protein) analysis
 *  - PDB 3D visualization
 *  - Advanced Tools: ORF Finder, K-mer Frequencies, etc.
 *
 * Copyright ©
 *   Rajkanwar Singh (https://github.com/Rajkanwars15)
 ******************************************************************/

document.addEventListener('DOMContentLoaded', () => {
    // Tab Navigation
    document.querySelectorAll('.tablink').forEach(btn => {
        btn.addEventListener('click', switchTab);
    });
    // Default tab: Home
    document.getElementById('homeTab').classList.add('active');

    // File loading
    document.getElementById('loadFastaBtn').addEventListener('click', loadFastaFile);
    document.getElementById('loadPdbBtn').addEventListener('click', loadPdbFile);

    // Sequence Analysis
    document.getElementById('searchBtn').addEventListener('click', searchSequences);
    document.getElementById('gcBtn').addEventListener('click', calcGCForAll);
    document.getElementById('revCompBtn').addEventListener('click', reverseComplementAll);
    document.getElementById('translateBtn').addEventListener('click', translateAll);

    // 3D Structure
    document.getElementById('render3DBtn').addEventListener('click', render3DStructure);

    // More Tools
    document.getElementById('statsBtn').addEventListener('click', computeSequenceStats);
    document.getElementById('tmBtn').addEventListener('click', calcMeltingTemp);
    document.getElementById('motifBtn').addEventListener('click', findMotif);
    document.getElementById('motifCountBtn').addEventListener('click', countMotif);
    document.getElementById('orfBtn').addEventListener('click', findORFs);
    document.getElementById('kmerBtn').addEventListener('click', computeKmerFrequencies);
});

/***************************************************************
 * TAB SWITCH
 ***************************************************************/
function switchTab(e) {
    const targetTab = e.target.getAttribute('data-tab');
    document.querySelectorAll('.tab-content').forEach(sec => sec.classList.remove('active'));
    document.getElementById(targetTab).classList.add('active');
}

/***************************************************************
 * GLOBAL STATE
 ***************************************************************/
let loadedFasta = [];   // array of { header, sequence }
let loadedPdbText = ""; // PDB data as a string

/***************************************************************
 * FILE LOADING
 ***************************************************************/
function loadFastaFile() {
    const fileInput = document.getElementById('fastaFile');
    const msg = document.getElementById('fastaLoadMsg');
    msg.textContent = '';

    const file = fileInput.files[0];
    if (!file) {
        msg.textContent = 'No FASTA file selected.';
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        loadedFasta = parseFasta(reader.result);
        renderFasta(loadedFasta);
        msg.textContent = 'FASTA loaded successfully!';
    };
    reader.readAsText(file);
}

function loadPdbFile() {
    const fileInput = document.getElementById('pdbFile');
    const msg = document.getElementById('pdbLoadMsg');
    msg.textContent = '';

    const file = fileInput.files[0];
    if (!file) {
        msg.textContent = 'No PDB file selected.';
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        loadedPdbText = reader.result;
        msg.textContent = 'PDB loaded successfully!';
    };
    reader.readAsText(file);
}

/***************************************************************
 * FASTA PARSING & RENDERING
 ***************************************************************/
function parseFasta(text) {
    const lines = text.split(/\r?\n/);
    let entries = [];
    let header = null;
    let seqLines = [];

    for (let line of lines) {
        if (line.startsWith('>')) {
            if (header) {
                entries.push({ header, sequence: seqLines.join('') });
            }
            header = line.substring(1).trim();
            seqLines = [];
        } else if (line.trim()) {
            seqLines.push(line.trim());
        }
    }
    if (header) {
        entries.push({ header, sequence: seqLines.join('') });
    }
    return entries;
}

function renderFasta(fastaArray, highlight='') {
    const displayDiv = document.getElementById('fastaDisplay');
    displayDiv.innerHTML = '';

    if (!fastaArray.length) {
        displayDiv.textContent = 'No FASTA data loaded.';
        return;
    }

    fastaArray.forEach(entry => {
        const headerDiv = document.createElement('div');
        headerDiv.className = 'fasta-header';
        headerDiv.textContent = '>' + entry.header;

        const seqDiv = document.createElement('div');
        seqDiv.className = 'fasta-sequence';
        if (highlight) {
            seqDiv.innerHTML = highlightSequence(entry.sequence, highlight);
        } else {
            seqDiv.textContent = entry.sequence;
        }
        displayDiv.appendChild(headerDiv);
        displayDiv.appendChild(seqDiv);
    });
}

/***************************************************************
 * SEARCH / HIGHLIGHT
 ***************************************************************/
function searchSequences() {
    const query = document.getElementById('searchQuery').value.trim();
    renderFasta(loadedFasta, query);
}

function highlightSequence(sequence, query) {
    const re = new RegExp(query, 'gi');
    return sequence.replace(re, match => `<span class="highlight">${match}</span>`);
}

/***************************************************************
 * GC CONTENT
 ***************************************************************/
function calcGCForAll() {
    const box = document.getElementById('gcResults');
    box.textContent = '';

    if (!loadedFasta.length) {
        box.textContent = 'No sequences loaded.';
        return;
    }

    let output = '';
    loadedFasta.forEach(entry => {
        const gcVal = gcContent(entry.sequence);
        output += `>${entry.header}\nGC%: ${gcVal.toFixed(2)}%\n\n`;
    });
    box.textContent = output.trim();
}

function gcContent(seq) {
    const s = seq.toUpperCase();
    const matches = s.match(/[GC]/g);
    if (!matches) return 0;
    return (matches.length / s.length) * 100;
}

/***************************************************************
 * REVERSE COMPLEMENT
 ***************************************************************/
function reverseComplementAll() {
    const box = document.getElementById('revCompResults');
    box.textContent = '';

    if (!loadedFasta.length) {
        box.textContent = 'No sequences loaded.';
        return;
    }

    let output = '';
    loadedFasta.forEach(entry => {
        const rc = revComp(entry.sequence);
        output += `>${entry.header}\n${rc}\n\n`;
    });
    box.textContent = output.trim();
}

function revComp(seq) {
    const map = {
        A:'T', T:'A', G:'C', C:'G',
        a:'t', t:'a', g:'c', c:'g',
        N:'N', n:'n'
    };
    return seq.split('')
        .reverse()
        .map(base => map[base] || base)
        .join('');
}

/***************************************************************
 * TRANSLATION (DNA → Protein)
 ***************************************************************/
function translateAll() {
    const box = document.getElementById('translateResults');
    box.textContent = '';

    if (!loadedFasta.length) {
        box.textContent = 'No sequences loaded.';
        return;
    }

    let output = '';
    loadedFasta.forEach(entry => {
        const protein = translateDNA(entry.sequence);
        output += `>${entry.header}\n${protein}\n\n`;
    });
    box.textContent = output.trim();
}

const codonTable = {
    'TTT':'F','TTC':'F','TTA':'L','TTG':'L',
    'TCT':'S','TCC':'S','TCA':'S','TCG':'S',
    'TAT':'Y','TAC':'Y','TAA':'*','TAG':'*',
    'TGT':'C','TGC':'C','TGA':'*','TGG':'W',
    'CTT':'L','CTC':'L','CTA':'L','CTG':'L',
    'CCT':'P','CCC':'P','CCA':'P','CCG':'P',
    'CAT':'H','CAC':'H','CAA':'Q','CAG':'Q',
    'CGT':'R','CGC':'R','CGA':'R','CGG':'R',
    'ATT':'I','ATC':'I','ATA':'I','ATG':'M',
    'ACT':'T','ACC':'T','ACA':'T','ACG':'T',
    'AAT':'N','AAC':'N','AAA':'K','AAG':'K',
    'AGT':'S','AGC':'S','AGA':'R','AGG':'R',
    'GTT':'V','GTC':'V','GTA':'V','GTG':'V',
    'GCT':'A','GCC':'A','GCA':'A','GCG':'A',
    'GAT':'D','GAC':'D','GAA':'E','GAG':'E',
    'GGT':'G','GGC':'G','GGA':'G','GGG':'G'
};

function translateDNA(seq) {
    const s = seq.toUpperCase();
    let protein = [];
    for (let i = 0; i < s.length; i += 3) {
        const codon = s.slice(i, i + 3);
        if (codon.length < 3) break;
        protein.push(codonTable[codon] || 'X');
    }
    return protein.join('');
}

/***************************************************************
 * 3D STRUCTURE (PDB)
 ***************************************************************/
function render3DStructure() {
    if (!loadedPdbText) {
        alert('No PDB file loaded yet.');
        return;
    }
    const viewerDiv = document.getElementById('viewer3D');
    viewerDiv.innerHTML = '';

    const viewer = $3Dmol.createViewer(viewerDiv, { backgroundColor: 'white' });
    viewer.addModel(loadedPdbText, 'pdb');
    viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
    viewer.zoomTo();
    viewer.render();
}

/***************************************************************
 * SEQUENCE STATISTICS
 ***************************************************************/
function computeSequenceStats() {
    const box = document.getElementById('statsResults');
    box.textContent = '';

    if (!loadedFasta.length) {
        box.textContent = 'No sequences loaded.';
        return;
    }

    let output = '';
    for (let e of loadedFasta) {
        output += `>${e.header}\n`;
        const stats = getSequenceStats(e.sequence);
        output += `  Length: ${stats.length}\n`;
        // Composition
        const letters = Object.keys(stats.composition).sort();
        letters.forEach(l => {
            output += `  ${l}: ${stats.composition[l]}\n`;
        });
        output += `  Type: ${stats.type}\n\n`;
    }
    box.textContent = output.trim();
}

function getSequenceStats(seq) {
    const length = seq.length;
    const composition = {};
    for (let c of seq) {
        const upper = c.toUpperCase();
        composition[upper] = (composition[upper] || 0) + 1;
    }
    // naive detection
    const dnaChars = ['A','T','G','C','N'];
    let dnaCount = 0, total = 0;
    for (let [base, count] of Object.entries(composition)) {
        total += count;
        if (dnaChars.includes(base)) {
            dnaCount += count;
        }
    }
    const ratio = dnaCount / total;
    let type = (ratio >= 0.9) ? 'DNA' : 'Protein (likely)';

    return { length, composition, type };
}

/***************************************************************
 * MELTING TEMP (Wallace Rule)
 ***************************************************************/
function calcMeltingTemp() {
    const box = document.getElementById('tmResults');
    box.textContent = '';

    if (!loadedFasta.length) {
        box.textContent = 'No sequences loaded.';
        return;
    }

    let output = '';
    for (let e of loadedFasta) {
        output += `>${e.header}\n`;
        const seq = e.sequence.toUpperCase();
        const len = seq.length;
        if (len <= 14) {
            const AorT = (seq.match(/[AT]/g) || []).length;
            const GorC = (seq.match(/[GC]/g) || []).length;
            const Tm = 2 * AorT + 4 * GorC;
            output += `  Tm (short DNA): ~${Tm}°C\n\n`;
        } else {
            output += `  Length > 14 nt, Wallace rule not applied.\n\n`;
        }
    }
    box.textContent = output.trim();
}

/***************************************************************
 * MOTIF FINDER (Lists positions)
 ***************************************************************/
function findMotif() {
    const pattern = document.getElementById('motifPattern').value.trim();
    const box = document.getElementById('motifResults');
    box.textContent = '';

    if (!pattern) {
        box.textContent = 'No motif/regex provided.';
        return;
    }
    if (!loadedFasta.length) {
        box.textContent = 'No sequences loaded.';
        return;
    }

    let output = '';
    let re;
    try {
        re = new RegExp(pattern, 'gi');
    } catch (err) {
        box.textContent = 'Invalid regex pattern.';
        return;
    }

    for (let e of loadedFasta) {
        output += `>${e.header}\n`;
        let seq = e.sequence;
        re.lastIndex = 0; // reset
        let match;
        let count = 0;
        while ((match = re.exec(seq)) !== null) {
            count++;
            const pos = match.index + 1; // 1-based
            output += `  Match #${count} at position ${pos}: ${match[0]}\n`;
        }
        if (count === 0) {
            output += '  No match found.\n';
        }
        output += '\n';
    }
    box.textContent = output.trim();
}

/***************************************************************
 * MOTIF COUNTER (Only counts total occurrences)
 ***************************************************************/
function countMotif() {
    const pattern = document.getElementById('motifCountPattern').value.trim();
    const box = document.getElementById('motifCountResults');
    box.textContent = '';

    if (!pattern) {
        box.textContent = 'No motif/regex provided.';
        return;
    }
    if (!loadedFasta.length) {
        box.textContent = 'No sequences loaded.';
        return;
    }

    let output = '';
    let re;
    try {
        re = new RegExp(pattern, 'gi');
    } catch (err) {
        box.textContent = 'Invalid regex pattern.';
        return;
    }

    for (let e of loadedFasta) {
        let seq = e.sequence;
        re.lastIndex = 0;
        let count = 0;
        while (re.exec(seq) !== null) {
            count++;
        }
        output += `>${e.header}\n  Total occurrences of "${pattern}": ${count}\n\n`;
    }
    box.textContent = output.trim();
}

/***************************************************************
 * ORF FINDER
 ***************************************************************/
function findORFs() {
    const box = document.getElementById('orfResults');
    box.textContent = '';
    if (!loadedFasta.length) {
        box.textContent = 'No sequences loaded.';
        return;
    }

    // We'll define start = ATG, stops = TAA/TAG/TGA
    const startCodon = 'ATG';
    const stopCodons = ['TAA','TAG','TGA'];

    let output = '';
    for (let e of loadedFasta) {
        const seq = e.sequence.toUpperCase();
        output += `>${e.header}\n`;

        let foundAny = false;
        // Three reading frames: 0, 1, 2
        for (let frame = 0; frame < 3; frame++) {
            let i = frame;
            while (i < seq.length - 2) {
                const codon = seq.slice(i, i+3);
                if (codon === startCodon) {
                    // found start
                    let j = i+3;
                    let foundStop = -1;
                    while (j < seq.length - 2) {
                        const codon2 = seq.slice(j, j+3);
                        if (stopCodons.includes(codon2)) {
                            foundStop = j;
                            break;
                        }
                        j += 3;
                    }
                    if (foundStop !== -1) {
                        const orfLength = foundStop + 3 - i; // includes stop codon
                        const orfSeq = seq.slice(i, foundStop + 3);
                        // Translate
                        const prot = translateDNA(orfSeq);
                        foundAny = true;
                        output += `  Frame ${frame+1}, Start:${i+1}, Stop:${foundStop+3}, Length:${orfLength} nt\n`;
                        output += `    Protein: ${prot}\n`;
                        i = foundStop + 3; // jump past stop
                    } else {
                        // no stop found, break
                        break;
                    }
                } else {
                    i += 3;
                }
            }
        }
        if (!foundAny) {
            output += '  No ORFs found.\n';
        }
        output += '\n';
    }
    box.textContent = output.trim();
}

/***************************************************************
 * K-MER FREQUENCY
 ***************************************************************/
function computeKmerFrequencies() {
    const box = document.getElementById('kmerResults');
    box.textContent = '';

    const k = parseInt(document.getElementById('kmerSize').value, 10);
    if (isNaN(k) || k < 1) {
        box.textContent = 'Invalid K value.';
        return;
    }
    if (!loadedFasta.length) {
        box.textContent = 'No sequences loaded.';
        return;
    }

    let output = '';
    for (let e of loadedFasta) {
        output += `>${e.header}\n`;
        const freqs = getKmerFreq(e.sequence, k);
        // sort by frequency descending
        const sortedKmers = Object.keys(freqs).sort((a,b) => freqs[b]-freqs[a]);
        sortedKmers.forEach(kmer => {
            output += `  ${kmer}: ${freqs[kmer]}\n`;
        });
        output += '\n';
    }
    box.textContent = output.trim();
}

function getKmerFreq(seq, k) {
    const freq = {};
    for (let i = 0; i <= seq.length - k; i++) {
        const kmer = seq.slice(i, i+k);
        freq[kmer] = (freq[kmer] || 0) + 1;
    }
    return freq;
}

/***************************************************************
 * DOWNLOAD RESULTS
 ***************************************************************/
function downloadResults(elementId, filename) {
    const textContent = document.getElementById(elementId).textContent;
    if (!textContent.trim()) {
        alert('No results to download!');
        return;
    }
    const blob = new Blob([textContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
