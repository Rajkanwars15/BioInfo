/*************************************************************************
 * BioInfo+
 * Updates/Changes:
 *  1. Dynamic Sequence Editing & Trimming with user-defined start/end,
 *     plus "Load Modified as New Set".
 *  2. Download button for each result box.
 *  3. Loading overlay for file reading/fetching (including chunk-based).
 *  4. Chunk-based reading approach to handle 50–100MB FASTA files better.
 *************************************************************************/

document.addEventListener('DOMContentLoaded', () => {
    // TAB NAVIGATION
    document.querySelectorAll('.tablink').forEach(btn => {
        btn.addEventListener('click', switchTab);
    });
    // Default tab
    document.getElementById('inputTab').classList.add('active');

    // DRAG & DROP
    setupDragAndDrop();

    // HOME / INPUT
    document.getElementById('loadFastaBtn').addEventListener('click', loadFastaNaive);
    document.getElementById('chunkFastaBtn').addEventListener('click', loadFastaChunked);
    document.getElementById('fetchFastaBtn').addEventListener('click', fetchFastaFromUrl);
    document.getElementById('genRandomFastaBtn').addEventListener('click', generateRandomFasta);

    // ANALYSIS
    document.getElementById('seqSearchBtn').addEventListener('click', searchSequences);
    document.getElementById('hdrFilterBtn').addEventListener('click', filterHeaders);

    document.getElementById('revCompBtn').addEventListener('click', computeReverseComplements);
    document.getElementById('gcBtn').addEventListener('click', computeGC);
    document.getElementById('lengthBtn').addEventListener('click', showLengths);
    document.getElementById('charCountBtn').addEventListener('click', countCharacters);

    document.getElementById('motifSearchBtn').addEventListener('click', searchMotifPositions);
    document.getElementById('motifCountBtn').addEventListener('click', countMotifs);

    document.getElementById('transcribeBtn').addEventListener('click', doTranscription);
    document.getElementById('translateBtn').addEventListener('click', doTranslation);
    document.getElementById('codonUsageBtn').addEventListener('click', doCodonUsage);
    document.getElementById('orfBtn').addEventListener('click', findORFs);

    document.getElementById('highlightBtn').addEventListener('click', highlightSubsequence);
    document.getElementById('statsBtn').addEventListener('click', showStats);
    document.getElementById('sortBtn').addEventListener('click', sortSequences);

    // Dynamic trimming
    document.getElementById('trimBtn').addEventListener('click', applyTrimming);
    document.getElementById('loadTrimmedBtn').addEventListener('click', loadTrimmedAsNewSet);

    document.getElementById('palindromeBtn').addEventListener('click', findPalindromes);
    document.getElementById('restrictionBtn').addEventListener('click', findRestrictionSites);

    document.getElementById('downloadFastaBtn').addEventListener('click', downloadCurrentFasta);

    // VISUALIZATION
    document.getElementById('plotGcBtn').addEventListener('click', plotGCContent);
    document.getElementById('plotBasePieBtn').addEventListener('click', plotBaseComposition);
    document.getElementById('plotLenHistBtn').addEventListener('click', plotLengthHistogram);
    document.getElementById('plotOrfMapBtn').addEventListener('click', plotORFMap);

    // STRUCTURE
    document.getElementById('renderPdbBtn').addEventListener('click', renderPdbStructure);

    // UTILITIES
    document.getElementById('removeDuplicatesBtn').addEventListener('click', removeDuplicates);
    document.getElementById('renameHeadersBtn').addEventListener('click', renameHeadersNaive);
    document.getElementById('clipboardBtn').addEventListener('click', copyFastaToClipboard);
    document.getElementById('saveSessionBtn').addEventListener('click', saveToSession);
    document.getElementById('loadSessionBtn').addEventListener('click', loadFromSession);
    document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);
    document.getElementById('exportJsonBtn').addEventListener('click', exportJSON);
});

/***************************************************************
 * GLOBAL
 ***************************************************************/
let loadedFasta = [];  // array of { header, sequence }
let loadedPdb = "";    // raw PDB content
let dragCounter = 0;   // for drag & drop

// For dynamic trimming, store results in a separate array to let user load them
let trimmedFasta = [];

/***************************************************************
 * TABS
 ***************************************************************/
function switchTab(e) {
    const targetId = e.target.getAttribute('data-tab');
    document.querySelectorAll('.tab-content').forEach(sec => sec.classList.remove('active'));
    document.getElementById(targetId).classList.add('active');
}

/***************************************************************
 * LOADING OVERLAY
 ***************************************************************/
function showOverlay(msg="Loading...") {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('show');
    document.getElementById('loadingMessage').textContent = msg;
}
function hideOverlay() {
    document.getElementById('loadingOverlay').classList.remove('show');
}

/***************************************************************
 * DRAG & DROP
 ***************************************************************/
function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    ['dragenter','dragover','dragleave','drop'].forEach(evt => {
        dropZone.addEventListener(evt, e => e.preventDefault());
    });
    dropZone.addEventListener('dragenter', () => {
        dragCounter++;
        dropZone.style.background='#e0ffe0';
    });
    dropZone.addEventListener('dragleave', () => {
        dragCounter--;
        if(dragCounter===0){
            dropZone.style.background='#fafafa';
        }
    });
    dropZone.addEventListener('drop', e => {
        dropZone.style.background='#fafafa';
        dragCounter=0;
        const files = e.dataTransfer.files;
        if(files.length){
            loadFastaFileList(files, false);
        }
    });
}

/***************************************************************
 * INPUT & SETUP
 ***************************************************************/
/** Naive load - readAsText in one shot */
function loadFastaNaive() {
    const fileList = document.getElementById('fastaFile').files;
    if(!fileList.length){
        document.getElementById('fastaLoadMsg').textContent='No files selected.';
        return;
    }
    loadFastaFileList(fileList, false);
}

/** Chunk-based load for large files (50-100MB) */
function loadFastaChunked() {
    const fileList = document.getElementById('fastaFile').files;
    if(!fileList.length){
        document.getElementById('fastaLoadMsg').textContent='No files selected.';
        return;
    }
    loadFastaFileList(fileList, true);
}

function loadFastaFileList(fileList, chunked=false) {
    showOverlay('Reading FASTA...');
    let msg = document.getElementById('fastaLoadMsg');
    msg.textContent='Loading...';

    let totalFiles = fileList.length;
    let filesRead=0;

    Array.from(fileList).forEach(file => {
        if(chunked) {
            readFastaInChunks(file, (err,text) => {
                if(err){
                    msg.textContent= `Error: ${err.message}`;
                    hideOverlay();
                    return;
                }
                parseFastaText(text);
                filesRead++;
                if(filesRead===totalFiles){
                    msg.textContent='All files loaded.';
                    renderFasta(loadedFasta);
                    hideOverlay();
                }
            });
        } else {
            // naive
            let reader=new FileReader();
            reader.onload=()=>{
                parseFastaText(reader.result);
                filesRead++;
                if(filesRead===totalFiles){
                    msg.textContent='All files loaded.';
                    renderFasta(loadedFasta);
                    hideOverlay();
                }
            };
            reader.onerror=()=>{
                msg.textContent=`Error reading ${file.name}`;
                hideOverlay();
            };
            reader.readAsText(file);
        }
    });
}

/** Read a large file in chunks (1 MB each, for example) */
function readFastaInChunks(file, callback) {
    const chunkSize = 1*1024*1024; // 1 MB
    let offset=0;
    let fileText='';

    const fileSize = file.size;

    function readNextChunk() {
        if(offset>=fileSize){
            callback(null, fileText);
            return;
        }
        const slice = file.slice(offset, offset+chunkSize);
        let fr=new FileReader();
        fr.onload = e => {
            let chunkText = e.target.result;
            fileText += chunkText;
            offset += chunkSize;
            showOverlay(`Reading chunks... ${Math.min(100, ((offset/fileSize)*100).toFixed(1))}%`);
            readNextChunk();
        };
        fr.onerror= e=> callback(e,null);
        fr.readAsText(slice);
    }
    readNextChunk();
}

function parseFastaText(text) {
    let lines = text.split(/\r?\n/);
    let header=null;
    let seqLines=[];
    for(let line of lines){
        if(line.startsWith('>')){
            if(header){
                loadedFasta.push({header, sequence: seqLines.join('')});
            }
            header=line.substring(1).trim();
            seqLines=[];
        } else if(line.trim()){
            seqLines.push(line.trim());
        }
    }
    if(header){
        loadedFasta.push({header, sequence: seqLines.join('')});
    }
}

function fetchFastaFromUrl() {
    const url=document.getElementById('fastaUrl').value.trim();
    const msg=document.getElementById('fastaFetchMsg');
    if(!url){
        msg.textContent='No URL provided.';
        return;
    }
    showOverlay('Fetching...');
    msg.textContent='Fetching...';

    fetch(url)
        .then(res=>{
            if(!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.text();
        })
        .then(txt=>{
            parseFastaText(txt);
            renderFasta(loadedFasta);
            msg.textContent='Fetched & loaded FASTA!';
            hideOverlay();
        })
        .catch(err=>{
            msg.textContent=`Error: ${err.message}`;
            hideOverlay();
        });
}

function generateRandomFasta() {
    const count=parseInt(document.getElementById('randCount').value)||2;
    const length=parseInt(document.getElementById('randLength').value)||50;
    const bases=['A','T','G','C'];

    for(let i=0;i<count;i++){
        let seq='';
        for(let j=0;j<length;j++){
            seq += bases[Math.floor(Math.random()*4)];
        }
        loadedFasta.push({header:`Random_${i+1}`, sequence:seq});
    }
    document.getElementById('randomFastaMsg').textContent='Random FASTA generated.';
    renderFasta(loadedFasta);
}

/***************************************************************
 * RENDER / DISPLAY
 ***************************************************************/
function renderFasta(fasta) {
    const disp=document.getElementById('fastaDisplay');
    disp.innerHTML='';
    if(!fasta.length){
        disp.textContent='No sequences loaded.';
        return;
    }
    fasta.forEach(e=>{
        let hdr=document.createElement('div');
        hdr.className='fasta-header';
        hdr.textContent='>'+e.header;

        let seq=document.createElement('div');
        seq.className='fasta-sequence';
        seq.textContent=e.sequence;

        disp.appendChild(hdr);
        disp.appendChild(seq);
    });
}

/***************************************************************
 * SEARCH & FILTER
 ***************************************************************/
function searchSequences() {
    const query=document.getElementById('seqSearch').value.trim().toLowerCase();
    if(!query) return;
    const filtered=loadedFasta.filter(e=>
        e.header.toLowerCase().includes(query) || e.sequence.toLowerCase().includes(query)
    );
    renderFasta(filtered);
}

function filterHeaders() {
    const kw=document.getElementById('hdrFilter').value.trim().toLowerCase();
    if(!kw) {
        renderFasta(loadedFasta);
        return;
    }
    const filtered=loadedFasta.filter(e=> e.header.toLowerCase().includes(kw));
    renderFasta(filtered);
}

/***************************************************************
 * BASIC ANALYSES
 ***************************************************************/
function computeReverseComplements() {
    const out=document.getElementById('revCompOutput');
    out.textContent='';
    if(!loadedFasta.length){
        out.textContent='No sequences loaded.';
        return;
    }
    let txt='';
    loadedFasta.forEach(e=>{
        let rc=reverseComplement(e.sequence);
        txt+= `>${e.header}\n${rc}\n\n`;
    });
    out.textContent=txt.trim();
}
function reverseComplement(seq){
    const map={A:'T',T:'A',G:'C',C:'G',a:'t',t:'a',g:'c',c:'g',N:'N',n:'n'};
    return seq.split('').reverse().map(b=> map[b]||b).join('');
}

function computeGC() {
    const out=document.getElementById('gcOutput');
    out.textContent='';
    if(!loadedFasta.length){
        out.textContent='No sequences loaded.';
        return;
    }
    let txt='';
    loadedFasta.forEach(e=>{
        let val=gcPercent(e.sequence).toFixed(2);
        txt+= `>${e.header}\nGC%: ${val}%\n\n`;
    });
    out.textContent=txt.trim();
}
function gcPercent(seq){
    let s=seq.toUpperCase();
    let m=s.match(/[GC]/g);
    if(!m) return 0;
    return (m.length/s.length)*100;
}

function showLengths() {
    const out=document.getElementById('lengthOutput');
    out.textContent='';
    if(!loadedFasta.length){
        out.textContent='No sequences loaded.';
        return;
    }
    let txt='';
    loadedFasta.forEach(e=>{
        txt+= `>${e.header}\nLength: ${e.sequence.length}\n\n`;
    });
    out.textContent=txt.trim();
}

function countCharacters() {
    const out=document.getElementById('charCountOutput');
    out.textContent='';
    if(!loadedFasta.length){
        out.textContent='No sequences loaded.';
        return;
    }
    let txt='';
    loadedFasta.forEach(e=>{
        let counts={};
        for(let c of e.sequence){
            let up=c.toUpperCase();
            counts[up]=(counts[up]||0)+1;
        }
        txt+= `>${e.header}\n`;
        Object.keys(counts).sort().forEach(k=>{
            txt+= `  ${k}: ${counts[k]}\n`;
        });
        txt+='\n';
    });
    out.textContent=txt.trim();
}

/***************************************************************
 * MOTIF SEARCH & COUNTER
 ***************************************************************/
function searchMotifPositions() {
    const pattern=document.getElementById('motifRegex').value;
    const out=document.getElementById('motifOutput');
    out.textContent='';
    if(!pattern){
        out.textContent='No motif regex provided.';
        return;
    }
    let re;
    try{
        re=new RegExp(pattern,'gi');
    }catch(err){
        out.textContent='Invalid regex: '+err.message;
        return;
    }
    if(!loadedFasta.length){
        out.textContent='No sequences loaded.';
        return;
    }

    let txt='';
    loadedFasta.forEach(e=>{
        txt+= `>${e.header}\n`;
        let seq=e.sequence;
        re.lastIndex=0;
        let match;
        let count=0;
        while((match=re.exec(seq))!==null){
            count++;
            let pos=match.index+1;
            txt+= `  Found #${count} at pos ${pos}: ${match[0]}\n`;
        }
        if(count===0) txt+='  No match found.\n';
        txt+='\n';
    });
    out.textContent=txt.trim();
}

function countMotifs() {
    const pattern=document.getElementById('motifRegex').value;
    const out=document.getElementById('motifOutput');
    out.textContent='';
    if(!pattern){
        out.textContent='No motif regex provided.';
        return;
    }
    let re;
    try{
        re=new RegExp(pattern,'gi');
    }catch(err){
        out.textContent='Invalid regex: '+err.message;
        return;
    }
    if(!loadedFasta.length){
        out.textContent='No sequences loaded.';
        return;
    }

    let txt='';
    loadedFasta.forEach(e=>{
        let seq=e.sequence;
        re.lastIndex=0;
        let count=0;
        while(re.exec(seq)!==null){
            count++;
        }
        txt+= `>${e.header}\n  Total occurrences of "${pattern}": ${count}\n\n`;
    });
    out.textContent=txt.trim();
}

/***************************************************************
 * TRANSCRIPTION / TRANSLATION
 ***************************************************************/
function doTranscription() {
    const out=document.getElementById('transcribeOutput');
    out.textContent='';
    if(!loadedFasta.length){
        out.textContent='No sequences loaded.';
        return;
    }
    let txt='';
    loadedFasta.forEach(e=>{
        let rna=e.sequence.toUpperCase().replace(/T/g,'U');
        txt+= `>${e.header}\n${rna}\n\n`;
    });
    out.textContent=txt.trim();
}

function doTranslation() {
    const out=document.getElementById('translateOutput');
    out.textContent='';
    if(!loadedFasta.length){
        out.textContent='No sequences loaded.';
        return;
    }
    let txt='';
    loadedFasta.forEach(e=>{
        let prot=rnaToProtein(e.sequence);
        txt+= `>${e.header}\n${prot}\n\n`;
    });
    out.textContent=txt.trim();
}

const rnaCodons={
    UUU:'F',UUC:'F',UUA:'L',UUG:'L',UCU:'S',UCC:'S',UCA:'S',UCG:'S',
    UAU:'Y',UAC:'Y',UAA:'*',UAG:'*',UGU:'C',UGC:'C',UGA:'*',UGG:'W',
    CUU:'L',CUC:'L',CUA:'L',CUG:'L',CCU:'P',CCC:'P',CCA:'P',CCG:'P',
    CAU:'H',CAC:'H',CAA:'Q',CAG:'Q',CGU:'R',CGC:'R',CGA:'R',CGG:'R',
    AUU:'I',AUC:'I',AUA:'I',AUG:'M',ACU:'T',ACC:'T',ACA:'T',ACG:'T',
    AAU:'N',AAC:'N',AAA:'K',AAG:'K',AGU:'S',AGC:'S',AGA:'R',AGG:'R',
    GUU:'V',GUC:'V',GUA:'V',GUG:'V',GCU:'A',GCC:'A',GCA:'A',GCG:'A',
    GAU:'D',GAC:'D',GAA:'E',GAG:'E',GGU:'G',GGC:'G',GGA:'G',GGG:'G'
};
function rnaToProtein(seq){
    let rna=seq.toUpperCase().replace(/T/g,'U');
    let protein=[];
    for(let i=0;i<rna.length;i+=3){
        if(i+3>rna.length) break;
        let codon=rna.slice(i,i+3);
        protein.push(rnaCodons[codon]||'X');
    }
    return protein.join('');
}

/** Codon Usage (DNA) */
function doCodonUsage() {
    const out=document.getElementById('codonUsageOutput');
    out.textContent='';
    if(!loadedFasta.length){
        out.textContent='No sequences loaded.';
        return;
    }
    let codons={};
    let total=0;
    loadedFasta.forEach(e=>{
        let seq=e.sequence.toUpperCase();
        for(let i=0;i<seq.length;i+=3){
            if(i+3>seq.length) break;
            let c=seq.slice(i,i+3);
            codons[c]=(codons[c]||0)+1;
            total++;
        }
    });
    let txt='Codon Usage:\n';
    Object.keys(codons).sort().forEach(c=>{
        let freq=((codons[c]/total)*100).toFixed(2);
        txt+= `  ${c}: ${codons[c]} times (${freq}%)\n`;
    });
    out.textContent=txt.trim();
}

/***************************************************************
 * ORF Finder
 ***************************************************************/
function findORFs() {
    const out=document.getElementById('orfOutput');
    out.textContent='';
    if(!loadedFasta.length){
        out.textContent='No sequences loaded.';
        return;
    }
    let txt='';
    const start='ATG';
    const stops=['TAA','TAG','TGA'];
    loadedFasta.forEach(e=>{
        let seq=e.sequence.toUpperCase();
        txt+= `>${e.header}\n`;
        let foundAny=false;
        for(let frame=0;frame<3;frame++){
            let i=frame;
            while(i<seq.length-2){
                let c=seq.slice(i,i+3);
                if(c===start){
                    // find stop
                    let j=i+3;
                    let stopPos=-1;
                    while(j<seq.length-2){
                        let c2=seq.slice(j,j+3);
                        if(stops.includes(c2)){
                            stopPos=j;
                            break;
                        }
                        j+=3;
                    }
                    if(stopPos!==-1){
                        foundAny=true;
                        let orfLen=(stopPos+3)-i;
                        txt+= `  Frame ${frame+1}, start=${i+1}, stop=${stopPos+3}, length=${orfLen}\n`;
                        i=stopPos+3;
                    } else {
                        break;
                    }
                } else {
                    i+=3;
                }
            }
        }
        if(!foundAny) txt+='  No ORFs found.\n';
        txt+='\n';
    });
    out.textContent=txt.trim();
}

/***************************************************************
 * SUBSEQ HIGHLIGHT
 ***************************************************************/
function highlightSubsequence() {
    const query=document.getElementById('highlightSubseq').value.trim();
    if(!query){
        renderFasta(loadedFasta);
        return;
    }
    const disp=document.getElementById('fastaDisplay');
    disp.innerHTML='';
    loadedFasta.forEach(e=>{
        let hdr=document.createElement('div');
        hdr.className='fasta-header';
        hdr.textContent='>'+e.header;

        let seq=document.createElement('div');
        seq.className='fasta-sequence';
        seq.innerHTML=highlight(e.sequence, query);

        disp.appendChild(hdr);
        disp.appendChild(seq);
    });
}
function highlight(seq, q){
    let re=new RegExp(q,'gi');
    return seq.replace(re,m=>`<span class="highlight">${m}</span>`);
}

/***************************************************************
 * STATS & SORT
 ***************************************************************/
function showStats() {
    const out=document.getElementById('statsOutput');
    out.textContent='';
    if(!loadedFasta.length){
        out.textContent='No sequences loaded.';
        return;
    }
    let total=loadedFasta.length;
    let totalLen=0;
    let totalGC=0;

    loadedFasta.forEach(e=>{
        let seq=e.sequence;
        totalLen+=seq.length;
        let m=seq.toUpperCase().match(/[GC]/g);
        if(m) totalGC+=m.length;
    });
    let avg=(totalLen/total).toFixed(2);
    let overallGC=totalLen>0 ? ((totalGC/totalLen)*100).toFixed(2):0;
    out.textContent=`Total sequences: ${total}\nAverage length: ${avg}\nOverall GC%: ${overallGC}`;
}

function sortSequences() {
    const mode=document.getElementById('sortMode').value;
    if(mode==='length'){
        loadedFasta.sort((a,b)=>a.sequence.length - b.sequence.length);
    } else if(mode==='gc'){
        loadedFasta.sort((a,b)=>gcPercent(a.sequence) - gcPercent(b.sequence));
    } else if(mode==='header'){
        loadedFasta.sort((a,b)=>a.header.localeCompare(b.header));
    }
    renderFasta(loadedFasta);
}

/***************************************************************
 * DYNAMIC TRIMMING
 ***************************************************************/
function applyTrimming() {
    const out=document.getElementById('editOutput');
    out.textContent='';

    if(!loadedFasta.length){
        out.textContent='No sequences loaded.';
        return;
    }
    let start=parseInt(document.getElementById('trimStart').value)||1;
    let end=parseInt(document.getElementById('trimEnd').value);

    trimmedFasta=[];
    loadedFasta.forEach(e=>{
        let seq=e.sequence;
        let length=seq.length;

        let actualStart=Math.max(1, start); // 1-based
        let actualEnd=(end && end<length) ? end : length;

        // convert to 0-based
        let sliceStart=actualStart-1;
        let sliceEnd=actualEnd;

        if(sliceStart>=sliceEnd){
            // if user gave invalid or 1>2 scenario
            trimmedFasta.push({header:e.header, sequence:''});
        } else {
            let newSeq=seq.slice(sliceStart, sliceEnd);
            trimmedFasta.push({header:e.header, sequence:newSeq});
        }
    });

    // Just preview them
    let txt='';
    trimmedFasta.forEach(e=>{
        txt+= `>${e.header}\n${e.sequence}\n\n`;
    });
    out.textContent=txt.trim();
}

function loadTrimmedAsNewSet() {
    if(!trimmedFasta.length){
        document.getElementById('editOutput').textContent='No trimmed data to load.';
        return;
    }
    loadedFasta=JSON.parse(JSON.stringify(trimmedFasta)); // clone
    renderFasta(loadedFasta);
    document.getElementById('editOutput').textContent+=' \n\nTrimmed set is now loaded as the main dataset.';
}

/***************************************************************
 * PALINDROME, RESTRICTION
 ***************************************************************/
function findPalindromes() {
    const out=document.getElementById('palindromeOutput');
    out.textContent='';
    if(!loadedFasta.length){
        out.textContent='No sequences loaded.';
        return;
    }
    let txt='';
    loadedFasta.forEach(e=>{
        txt+=`>${e.header}\n`;
        let seq=e.sequence.toUpperCase();
        let count=0;
        for(let start=0;start<seq.length;start++){
            for(let end=start+3; end<seq.length;end++){
                let fragment=seq.slice(start,end+1);
                if(isPalindrome(fragment)){
                    count++;
                    txt+=`  Palindrome #${count} at [${start+1}-${end+1}]: ${fragment}\n`;
                }
            }
        }
        if(count===0) txt+='  No palindromes (≥4bp) found.\n';
        txt+='\n';
    });
    out.textContent=txt.trim();
}
function isPalindrome(str){
    if(str.length<4) return false;
    return str===reverseComplement(str);
}

function findRestrictionSites() {
    const out=document.getElementById('restrictionOutput');
    out.textContent='';

    if(!loadedFasta.length){
        out.textContent='No sequences loaded.';
        return;
    }
    let dictionary={
        EcoRI:'GAATTC',
        HindIII:'AAGCTT',
        BamHI:'GGATCC'
    };
    let txt='';
    loadedFasta.forEach(e=>{
        let seq=e.sequence.toUpperCase();
        txt+=`>${e.header}\n`;
        let foundAny=false;
        Object.keys(dictionary).forEach(enzyme=>{
            let site=dictionary[enzyme];
            let idx=seq.indexOf(site);
            if(idx>=0){
                foundAny=true;
                let positions=[];
                while(idx>=0){
                    positions.push(idx+1);
                    idx=seq.indexOf(site, idx+1);
                }
                txt+=`  ${enzyme} (${site}) at positions: ${positions.join(', ')}\n`;
            }
        });
        if(!foundAny) txt+='  No known sites found.\n';
        txt+='\n';
    });
    out.textContent=txt.trim();
}

/***************************************************************
 * DOWNLOAD FASTA
 ***************************************************************/
function downloadCurrentFasta() {
    if(!loadedFasta.length){
        alert('No sequences to download.');
        return;
    }
    let text='';
    loadedFasta.forEach(e=>{
        text+= `>${e.header}\n${e.sequence}\n`;
    });
    downloadText(text,'current_sequences.fasta');
}

/***************************************************************
 * VISUALIZATION (Canvas-based)
 ***************************************************************/
function plotGCContent() {
    if(!loadedFasta.length){
        alert('No sequences loaded.');
        return;
    }
    const canvas=document.getElementById('gcCanvas');
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);

    let barWidth=Math.floor(canvas.width/loadedFasta.length);
    let maxHeight=canvas.height-20;

    loadedFasta.forEach((entry,i)=>{
        const gc=gcPercent(entry.sequence);
        const barHeight=(gc/100)*maxHeight;
        const x=i*barWidth;
        const y=canvas.height-barHeight;

        ctx.fillStyle='#4CAF50';
        ctx.fillRect(x,y,barWidth-2,barHeight);

        ctx.fillStyle='#000';
        ctx.font='10px Arial';
        ctx.fillText(gc.toFixed(1), x+2,y-2);
    });
}

function plotBaseComposition() {
    if(!loadedFasta.length){
        alert('No sequences loaded.');
        return;
    }
    const seq=loadedFasta[0].sequence.toUpperCase();
    const counts={A:0,T:0,G:0,C:0};
    for(let c of seq){
        if(counts[c]!==undefined) counts[c]++;
    }
    const total=seq.length||1;

    const canvas=document.getElementById('basePieCanvas');
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);

    const slices=[
        {base:'A', color:'#ff6666'},
        {base:'T', color:'#6666ff'},
        {base:'G', color:'#66ff66'},
        {base:'C', color:'#ffff66'}
    ];
    let startAngle=0;
    slices.forEach(s=>{
        const fraction=counts[s.base]/total;
        const angle=fraction*2*Math.PI;
        ctx.beginPath();
        ctx.moveTo(canvas.width/2,canvas.height/2);
        ctx.arc(canvas.width/2,canvas.height/2,100,startAngle,startAngle+angle);
        ctx.fillStyle=s.color;
        ctx.fill();
        // label
        const mid=startAngle+angle/2;
        const lx=canvas.width/2 + 70*Math.cos(mid);
        const ly=canvas.height/2 + 70*Math.sin(mid);
        ctx.fillStyle='#000';
        ctx.font='10px Arial';
        ctx.fillText(`${s.base} (${counts[s.base]})`, lx-10,ly);
        startAngle+=angle;
    });
}

function plotLengthHistogram() {
    if(!loadedFasta.length){
        alert('No sequences loaded.');
        return;
    }
    const lengths=loadedFasta.map(e=>e.sequence.length);
    const maxLen=Math.max(...lengths);
    const binCount=10;
    const binSize=Math.ceil(maxLen/binCount);
    let bins=new Array(binCount).fill(0);

    lengths.forEach(l=>{
        let idx=Math.min(Math.floor(l/binSize),binCount-1);
        bins[idx]++;
    });

    const canvas=document.getElementById('lenHistCanvas');
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);

    let barWidth=Math.floor(canvas.width/binCount);
    let maxBin=Math.max(...bins);
    let scale=(canvas.height-20)/maxBin;

    bins.forEach((count,i)=>{
        let x=i*barWidth;
        let barH=count*scale;
        ctx.fillStyle='#4CAF50';
        ctx.fillRect(x,canvas.height-barH,barWidth-2,barH);

        ctx.fillStyle='#000';
        ctx.font='10px Arial';
        ctx.fillText(`[${i*binSize}-${(i+1)*binSize-1}]`, x+2, canvas.height-barH-2);
        ctx.fillText(count, x+2, canvas.height-2);
    });
}

function plotORFMap() {
    if(!loadedFasta.length){
        alert('No sequences loaded.');
        return;
    }
    let seq=loadedFasta[0].sequence.toUpperCase();
    const canvas=document.getElementById('orfMapCanvas');
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);

    let length=seq.length;
    let scale=canvas.width/length;

    // find orfs
    let starts=[];
    let stops=[];
    const start='ATG';
    const ends=['TAA','TAG','TGA'];
    for(let frame=0; frame<3; frame++){
        let i=frame;
        while(i<length-2){
            let c=seq.slice(i,i+3);
            if(c===start){
                let j=i+3;
                let stopPos=-1;
                while(j<length-2){
                    let c2=seq.slice(j,j+3);
                    if(ends.includes(c2)){
                        stopPos=j+3;
                        break;
                    }
                    j+=3;
                }
                if(stopPos>0){
                    starts.push(i);
                    stops.push(stopPos);
                    i=stopPos;
                } else {
                    break;
                }
            } else {
                i+=3;
            }
        }
    }
    // main line
    ctx.strokeStyle='#000';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height/2);
    ctx.lineTo(canvas.width, canvas.height/2);
    ctx.stroke();

    ctx.fillStyle='rgba(255,0,0,0.5)';
    for(let i=0;i<starts.length;i++){
        let st=starts[i];
        let en=stops[i];
        let x=st*scale;
        let w=(en-st)*scale;
        ctx.fillRect(x, canvas.height/2-10, w, 20);
    }
}

/***************************************************************
 * 3D STRUCTURE
 ***************************************************************/
function renderPdbStructure() {
    if(!loadedPdb){
        alert('No PDB loaded yet.');
        return;
    }
    const div=document.getElementById('pdbViewer');
    div.innerHTML='';
    const viewer=$3Dmol.createViewer(div,{backgroundColor:'white'});
    viewer.addModel(loadedPdb,'pdb');
    viewer.setStyle({}, {cartoon:{color:'spectrum'}});
    viewer.zoomTo();
    viewer.render();
}

/***************************************************************
 * UTILITIES
 ***************************************************************/
function removeDuplicates() {
    const out=document.getElementById('duplicateOutput');
    out.textContent='';
    if(!loadedFasta.length){
        out.textContent='No sequences loaded.';
        return;
    }
    let seen=new Set();
    let unique=[];
    let removed=0;
    loadedFasta.forEach(e=>{
        let key=e.sequence+'|'+e.header;
        if(!seen.has(key)){
            seen.add(key);
            unique.push(e);
        } else {
            removed++;
        }
    });
    loadedFasta=unique;
    renderFasta(loadedFasta);
    out.textContent=`Removed ${removed} duplicates. ${loadedFasta.length} remain.`;
}

function renameHeadersNaive() {
    loadedFasta.forEach((e,i)=>{
        e.header=`Seq${i+1}`;
    });
    renderFasta(loadedFasta);
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

function copyFastaToClipboard() {
    if(!loadedFasta.length){
        alert('No sequences to copy.');
        return;
    }
    let text='';
    loadedFasta.forEach(e=>{
        text+= `>${e.header}\n${e.sequence}\n`;
    });
    navigator.clipboard.writeText(text).then(()=>{
        alert('FASTA copied.');
    }).catch(err=>{
        alert('Clipboard error: '+err.message);
    });
}

function saveToSession() {
    if(!loadedFasta.length){
        document.getElementById('sessionMsg').textContent='No sequences loaded.';
        return;
    }
    sessionStorage.setItem('fastaData', JSON.stringify(loadedFasta));
    document.getElementById('sessionMsg').textContent='FASTA saved to session.';
}
function loadFromSession() {
    let data=sessionStorage.getItem('fastaData');
    if(!data){
        document.getElementById('sessionMsg').textContent='No data in session.';
        return;
    }
    loadedFasta=JSON.parse(data);
    renderFasta(loadedFasta);
    document.getElementById('sessionMsg').textContent='FASTA restored.';
}

function exportCSV() {
    if(!loadedFasta.length){
        alert('No sequences to export.');
        return;
    }
    let lines=['header,sequence,length,gc'];
    loadedFasta.forEach(e=>{
        let len=e.sequence.length;
        let gc=gcPercent(e.sequence).toFixed(2);
        let row=`"${e.header}","${e.sequence}",${len},${gc}`;
        lines.push(row);
    });
    let csv=lines.join('\n');
    downloadText(csv,'fasta_data.csv');
}

function exportJSON() {
    if(!loadedFasta.length){
        alert('No sequences to export.');
        return;
    }
    let json=JSON.stringify(loadedFasta,null,2);
    downloadText(json,'fasta_data.json');
}

/** Download text helper */
function downloadText(content,filename){
    const blob=new Blob([content],{type:'text/plain'});
    const link=document.createElement('a');
    link.href=URL.createObjectURL(blob);
    link.download=filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/** Download specific results by element ID */
function downloadResults(elementId,filename){
    const content=document.getElementById(elementId).textContent;
    if(!content.trim()){
        alert('No content to download.');
        return;
    }
    downloadText(content,filename);
}
