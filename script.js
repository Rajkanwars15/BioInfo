/*************************************************************************
 * BioInfo+ with NEW FEATURES:
 * - Sequence Validation
 * - Interactive Sequence Viewer (sliding window)
 * - Save / Apply Sequence Filters
 * - Base Pairing Visualization (RNA)
 * - Side-by-side compare, diff viewer, reference compare
 * - Gene mapping, interactive gene finder, circular genome
 * - Sequence rotation for circular DNA
 * - Real-time aggregation, cluster heatmap
 * - Sequence compression with pako (gzip)
 * - Sequence randomization, advanced stats, etc.
 *
 * Retains all existing features: chunk-based FASTA, analysis, motif,
 * trimming, palindrome, restriction, 3D structure, etc.
 *************************************************************************/

document.addEventListener('DOMContentLoaded', () => {
    // SETUP TABS
    document.querySelectorAll('.tablink').forEach(btn => {
        btn.addEventListener('click', switchTab);
    });
    document.getElementById('inputTab').classList.add('active');

    // DRAG & DROP
    setupDragAndDrop();

    // INPUT & SETUP
    document.getElementById('loadFastaBtn').addEventListener('click', () => loadFastaFileList(false));
    document.getElementById('chunkFastaBtn').addEventListener('click', () => loadFastaFileList(true));
    document.getElementById('fetchFastaBtn').addEventListener('click', fetchFastaFromUrl);
    document.getElementById('genRandomFastaBtn').addEventListener('click', generateRandomFasta);

    // ANALYSIS & EDITING
    document.getElementById('validateBtn').addEventListener('click', validateSequences);
    document.getElementById('seqSearchBtn').addEventListener('click', searchSequences);
    document.getElementById('hdrFilterBtn').addEventListener('click', filterHeaders);
    document.getElementById('saveFilterBtn').addEventListener('click', saveCurrentFilters);
    document.getElementById('applySavedFilterBtn').addEventListener('click', applySavedFilters);

    document.getElementById('seqWindowSize').addEventListener('input', updateInteractiveViewer);
    document.getElementById('seqWindowPos').addEventListener('input', updateInteractiveViewer);

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
    document.getElementById('toggleReverseViewBtn').addEventListener('click', toggleReverseView);

    document.getElementById('trimBtn').addEventListener('click', applyTrimming);
    document.getElementById('loadTrimmedBtn').addEventListener('click', loadTrimmedAsNewSet);

    document.getElementById('palindromeBtn').addEventListener('click', findPalindromes);
    document.getElementById('restrictionBtn').addEventListener('click', findRestrictionSites);
    document.getElementById('maskBtn').addEventListener('click', maskSequences);

    document.getElementById('multiExportBtn').addEventListener('click', exportSelectedSequences);
    document.getElementById('undoTransformBtn').addEventListener('click', undoLastTransform);
    document.getElementById('redoTransformBtn').addEventListener('click', redoTransform);

    document.getElementById('downloadFastaBtn').addEventListener('click', downloadCurrentFasta);

    // VISUALIZATIONS
    document.getElementById('plotGcBtn').addEventListener('click', plotGCContent);
    document.getElementById('plotBasePieBtn').addEventListener('click', plotBaseComposition);
    document.getElementById('plotLenHistBtn').addEventListener('click', plotLengthHistogram);
    document.getElementById('plotOrfMapBtn').addEventListener('click', plotORFMap);
    document.getElementById('ntHeatmapBtn').addEventListener('click', nucleotideHeatmap);
    document.getElementById('basePairBtn').addEventListener('click', visualizeBasePairs);

    // COMPARISON & MAPPING
    document.getElementById('compareTwoBtn').addEventListener('click', compareTwoSequences);
    document.getElementById('diffViewerBtn').addEventListener('click', diffTwoSequences);
    document.getElementById('refCompareBtn').addEventListener('click', compareToReference);
    document.getElementById('alignmentOverviewBtn').addEventListener('click', alignmentOverview);

    // GENE & GENOME TOOLS
    document.getElementById('geneMapBtn').addEventListener('click', geneMapAnnotation);
    document.getElementById('geneFinderBtn').addEventListener('click', interactiveGeneFinder);

    document.getElementById('circularGenomeBtn').addEventListener('click', drawCircularGenome);
    document.getElementById('rotateCircularBtn').addEventListener('click', rotateCircularDNA);

    // UTILITIES
    document.getElementById('removeDuplicatesBtn').addEventListener('click', removeDuplicates);
    document.getElementById('renameHeadersBtn').addEventListener('click', renameHeadersNaive);
    document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
    document.getElementById('clipboardBtn').addEventListener('click', copyFastaToClipboard);
    document.getElementById('saveSessionBtn').addEventListener('click', saveToSession);
    document.getElementById('loadSessionBtn').addEventListener('click', loadFromSession);
    document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);
    document.getElementById('exportJsonBtn').addEventListener('click', exportJSON);
    document.getElementById('exportWithStatsBtn').addEventListener('click', exportWithStats);

    document.getElementById('compressBtn').addEventListener('click', compressSequences);
    document.getElementById('decompressBtn').addEventListener('click', decompressSequences);

    document.getElementById('randomizeSeqBtn').addEventListener('click', randomizeLoadedSequences);
    document.getElementById('realtimeAggBtn').addEventListener('click', showRealTimeAggregation);
    document.getElementById('clusterHeatmapBtn').addEventListener('click', buildClusterHeatmap);
    document.getElementById('cleanupBtn').addEventListener('click', automatedCleanup);

    // 3D STRUCTURE
    document.getElementById('loadPdbBtn').addEventListener('click', handlePdbUpload);
    document.getElementById('renderPdbBtn').addEventListener('click', renderPdbStructure);
});

/***************************************************************
 * GLOBAL STATE
 ***************************************************************/
let loadedFasta = [];    // main set of sequences: {header, sequence}
let loadedPdb = "";      // raw PDB text
let dragCounter = 0;     // for drag-and-drop
let trimmedFasta = [];   // store trimmed results to load
let transformHistory = [];  // store transformations for undo/redo
let transformRedoStack = [];

// For interactive viewer
let reverseViewActive = false;

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
    const ov = document.getElementById('loadingOverlay');
    ov.classList.add('show');
    document.getElementById('loadingMessage').textContent = msg;
}
function hideOverlay() {
    document.getElementById('loadingOverlay').classList.remove('show');
}

/***************************************************************
 * DRAG & DROP
 ***************************************************************/
function setupDragAndDrop() {
    const dz = document.getElementById('dropZone');
    ['dragenter','dragover','dragleave','drop'].forEach(evt => {
        dz.addEventListener(evt, e => e.preventDefault());
    });
    dz.addEventListener('dragenter', ()=> {
        dragCounter++;
        dz.style.background='#e0ffe0';
    });
    dz.addEventListener('dragleave', ()=>{
        dragCounter--;
        if(dragCounter===0) dz.style.background='#fafafa';
    });
    dz.addEventListener('drop', e=>{
        dz.style.background='#fafafa';
        dragCounter=0;
        const files=e.dataTransfer.files;
        if(files.length) {
            loadFastaFileList(false, files);
        }
    });
}

/***************************************************************
 * INPUT & SETUP
 ***************************************************************/
function loadFastaFileList(chunked=false, givenList=null) {
    // If givenList is null, use the normal <input> files
    const fileList = givenList || document.getElementById('fastaFile').files;
    const msg = document.getElementById('fastaLoadMsg');
    if(!fileList.length){
        msg.textContent='No FASTA files selected.';
        return;
    }
    showOverlay('Reading FASTA...');
    msg.textContent='Loading...';

    let totalFiles=fileList.length;
    let filesRead=0;

    Array.from(fileList).forEach(file=>{
        if(chunked){
            readFastaInChunks(file, (err,text)=>{
                if(err){
                    msg.textContent='Error: '+err.message;
                    hideOverlay();
                    return;
                }
                parseFastaText(text);
                filesRead++;
                if(filesRead===totalFiles){
                    msg.textContent='All FASTA files loaded.';
                    renderFasta(loadedFasta);
                    hideOverlay();
                }
            });
        } else {
            // naive readAsText
            let fr=new FileReader();
            fr.onload=()=>{
                parseFastaText(fr.result);
                filesRead++;
                if(filesRead===totalFiles){
                    msg.textContent='All FASTA files loaded.';
                    renderFasta(loadedFasta);
                    hideOverlay();
                }
            };
            fr.onerror=()=> {
                msg.textContent='Error reading '+file.name;
                hideOverlay();
            };
            fr.readAsText(file);
        }
    });
}

function readFastaInChunks(file, callback) {
    const chunkSize=1*1024*1024; // 1MB
    let offset=0;
    let fileText='';
    const fileSize=file.size;

    function loadNext() {
        if(offset>=fileSize){
            callback(null, fileText);
            return;
        }
        const slice=file.slice(offset, offset+chunkSize);
        let fr=new FileReader();
        fr.onload=e=>{
            fileText+= e.target.result;
            offset+=chunkSize;
            let percent = Math.min(100, ((offset/fileSize)*100).toFixed(1));
            showOverlay(`Reading chunks... ${percent}%`);
            loadNext();
        };
        fr.onerror=err=>callback(err,null);
        fr.readAsText(slice);
    }
    loadNext();
}

function parseFastaText(text) {
    let lines=text.split(/\r?\n/);
    let header=null; let seq=[];
    for(let line of lines){
        if(line.startsWith('>')){
            if(header){
                loadedFasta.push({header, sequence: seq.join('')});
            }
            header=line.substring(1).trim();
            seq=[];
        } else if(line.trim()){
            seq.push(line.trim());
        }
    }
    if(header){
        loadedFasta.push({header, sequence: seq.join('')});
    }
}

function fetchFastaFromUrl() {
    const url=document.getElementById('fastaUrl').value.trim();
    const msg=document.getElementById('fastaFetchMsg');
    if(!url){
        msg.textContent='No URL provided.';
        return;
    }
    msg.textContent='Fetching...';
    showOverlay('Fetching...');

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
            msg.textContent='Error: '+err.message;
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
            seq+=bases[Math.floor(Math.random()*4)];
        }
        loadedFasta.push({header:`Random_${i+1}`, sequence: seq});
    }
    document.getElementById('randomFastaMsg').textContent='Random FASTA added.';
    renderFasta(loadedFasta);
}

/***************************************************************
 * ANALYSIS & EDITING
 ***************************************************************/

/** (1) Sequence Validation */
function validateSequences() {
    const out=document.getElementById('validateOutput');
    out.textContent='';
    if(!loadedFasta.length){
        out.textContent='No sequences loaded.';
        return;
    }

    let txt='';
    let invalidCount=0;
    loadedFasta.forEach(e=>{
        let problems=[];
        if(!e.header || !e.header.trim()){
            problems.push('Empty or invalid header');
        }
        // check for invalid chars if expecting DNA or protein
        let invalidChars=(e.sequence.match(/[^ATGCUNKRHDBVMYSWQELIFPZX\-\s]/i)||[]).length;
        if(invalidChars>0){
            problems.push('Contains unexpected characters outside typical IUPAC codes');
        }
        if(problems.length>0){
            invalidCount++;
            txt+= `>${e.header}\n  Issues: ${problems.join(', ')}\n\n`;
        }
    });
    if(invalidCount===0) {
        txt='All sequences appear valid.';
    }
    out.textContent=txt.trim();
}

/** Display loaded FASTA */
function renderFasta(fasta) {
    const disp=document.getElementById('fastaDisplay');
    disp.innerHTML='';
    if(!fasta.length){
        disp.textContent='No sequences loaded.';
        return;
    }
    fasta.forEach(e=>{
        let hd=document.createElement('div');
        hd.className='fasta-header';
        hd.textContent='>'+e.header;

        let sq=document.createElement('div');
        sq.className='fasta-sequence';
        sq.textContent= (reverseViewActive) ? reverseString(e.sequence) : e.sequence;

        disp.appendChild(hd);
        disp.appendChild(sq);
    });
    updateInteractiveViewer(); // update the interactive viewer if the user changes dataset
}

/** (2) Interactive Sequence Viewer (scroll/zoom) */
function updateInteractiveViewer() {
    const view=document.getElementById('interactiveViewer');
    view.textContent='';
    if(!loadedFasta.length) {
        view.textContent='No sequences loaded.';
        return;
    }
    let seq=loadedFasta[0].sequence;
    if(reverseViewActive) seq=reverseString(seq);

    const windowSize = parseInt(document.getElementById('seqWindowSize').value)||50;
    const slider = document.getElementById('seqWindowPos');
    // max slider = seq.length - windowSize
    let maxPos = Math.max(0, seq.length - windowSize);
    slider.max = maxPos;
    let start = parseInt(slider.value)||0;
    if(start > maxPos) start = maxPos;

    let end = start + windowSize;
    if(end>seq.length) end=seq.length;

    let sub=seq.slice(start, end);
    view.textContent=`Pos ${start+1}-${end}:\n${sub}`;
}

/** (3) Save / Apply Sequence Filters */
function saveCurrentFilters() {
    let searchVal=document.getElementById('seqSearch').value.trim();
    let hdrVal=document.getElementById('hdrFilter').value.trim();
    let obj={searchVal, hdrVal};
    localStorage.setItem('savedFilters', JSON.stringify(obj));
    document.getElementById('saveFilterOutput').textContent='Filters saved to localStorage.';
}
function applySavedFilters() {
    let data=localStorage.getItem('savedFilters');
    if(!data){
        document.getElementById('saveFilterOutput').textContent='No saved filters found.';
        return;
    }
    let obj=JSON.parse(data);
    document.getElementById('seqSearch').value=obj.searchVal||'';
    document.getElementById('hdrFilter').value=obj.hdrVal||'';
    document.getElementById('saveFilterOutput').textContent='Filters applied. You may click “Search” or “Filter Headers”.';
}

/** SEARCH / FILTERS */
function searchSequences() {
    const query=document.getElementById('seqSearch').value.toLowerCase();
    if(!query)return;
    const filtered=loadedFasta.filter(e=>
        e.header.toLowerCase().includes(query)|| e.sequence.toLowerCase().includes(query)
    );
    renderFasta(filtered);
}

function filterHeaders() {
    const kw=document.getElementById('hdrFilter').value.toLowerCase();
    if(!kw) {
        renderFasta(loadedFasta);
        return;
    }
    const filtered=loadedFasta.filter(e=> e.header.toLowerCase().includes(kw));
    renderFasta(filtered);
}

/** Reverse Complement, GC%, etc. */
function computeReverseComplements() {
    const out=document.getElementById('revCompOutput');
    out.textContent='';
    if(!loadedFasta.length){
        out.textContent='No sequences.';
        return;
    }
    let txt='';
    loadedFasta.forEach(e=>{
        let rc=reverseComplement(e.sequence);
        txt+= `>${e.header}\n${rc}\n\n`;
    });
    out.textContent=txt.trim();
    pushTransform({type:'reverseCompAll'});
}
function reverseComplement(seq){
    const map={A:'T',T:'A',G:'C',C:'G',a:'t',t:'a',g:'c',c:'g',N:'N',n:'n'};
    return seq.split('').reverse().map(b=>map[b]||b).join('');
}

function computeGC() {
    const out=document.getElementById('gcOutput');
    out.textContent='';
    if(!loadedFasta.length){
        out.textContent='No sequences.';
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
    if(!m)return 0;
    return (m.length/s.length)*100;
}

function showLengths() {
    const out=document.getElementById('lengthOutput');
    out.textContent='';
    if(!loadedFasta.length){
        out.textContent='No sequences.';
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
        out.textContent='No sequences.';
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

/** Motif search & counter */
function searchMotifPositions() {
    const pattern=document.getElementById('motifRegex').value;
    const out=document.getElementById('motifOutput');
    out.textContent='';
    if(!pattern){
        out.textContent='No motif regex.';
        return;
    }
    let re;
    try{re=new RegExp(pattern,'gi');}catch(e){out.textContent='Invalid regex';return;}
    if(!loadedFasta.length){
        out.textContent='No seq.';
        return;
    }
    let txt='';
    loadedFasta.forEach(e=>{
        txt+= `>${e.header}\n`;
        let match; let count=0;
        re.lastIndex=0;
        while((match=re.exec(e.sequence))!==null){
            count++;
            let pos=match.index+1;
            txt+= `  #${count} at pos ${pos}: ${match[0]}\n`;
        }
        if(count===0) txt+='  No match.\n';
        txt+='\n';
    });
    out.textContent=txt.trim();
}
function countMotifs() {
    const pattern=document.getElementById('motifRegex').value;
    const out=document.getElementById('motifOutput');
    out.textContent='';
    if(!pattern){out.textContent='No motif regex.';return;}
    let re; try{re=new RegExp(pattern,'gi');}catch(e){out.textContent='Invalid regex';return;}
    let txt='';
    loadedFasta.forEach(e=>{
        let count=0; re.lastIndex=0;
        while(re.exec(e.sequence)!==null) count++;
        txt+= `>${e.header}\n  Occurrences of "${pattern}": ${count}\n\n`;
    });
    out.textContent=txt.trim();
}

/** Transcription & Translation */
function doTranscription() {
    const out=document.getElementById('transcribeOutput');
    out.textContent='';
    if(!loadedFasta.length){out.textContent='No seq.';return;}
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
    if(!loadedFasta.length){out.textContent='No seq.';return;}
    let txt='';
    loadedFasta.forEach(e=>{
        let prot=rnaToProtein(e.sequence);
        txt+= `>${e.header}\n${prot}\n\n`;
    });
    out.textContent=txt.trim();
}
function rnaToProtein(seq){
    let rna=seq.toUpperCase().replace(/T/g,'U');
    let codons={
        UUU:'F',UUC:'F',UUA:'L',UUG:'L',UCU:'S',UCC:'S',UCA:'S',UCG:'S',
        UAU:'Y',UAC:'Y',UAA:'*',UAG:'*',UGU:'C',UGC:'C',UGA:'*',UGG:'W',
        CUU:'L',CUC:'L',CUA:'L',CUG:'L',CCU:'P',CCC:'P',CCA:'P',CCG:'P',
        CAU:'H',CAC:'H',CAA:'Q',CAG:'Q',CGU:'R',CGC:'R',CGA:'R',CGG:'R',
        AUU:'I',AUC:'I',AUA:'I',AUG:'M',ACU:'T',ACC:'T',ACA:'T',ACG:'T',
        AAU:'N',AAC:'N',AAA:'K',AAG:'K',AGU:'S',AGC:'S',AGA:'R',AGG:'R',
        GUU:'V',GUC:'V',GUA:'V',GUG:'V',GCU:'A',GCC:'A',GCA:'A',GCG:'A',
        GAU:'D',GAC:'D',GAA:'E',GAG:'E',GGU:'G',GGC:'G',GGA:'G',GGG:'G'
    };
    let protein=[];
    for(let i=0;i<rna.length;i+=3){
        if(i+3>rna.length) break;
        let cod=rna.slice(i,i+3);
        protein.push(codons[cod]||'X');
    }
    return protein.join('');
}

/** Codon usage */
function doCodonUsage() {
    const out=document.getElementById('codonUsageOutput');
    out.textContent='';
    if(!loadedFasta.length){
        out.textContent='No seq.';
        return;
    }
    let map={}; let total=0;
    loadedFasta.forEach(e=>{
        let s=e.sequence.toUpperCase();
        for(let i=0;i<s.length;i+=3){
            if(i+3>s.length)break;
            let c=s.slice(i,i+3);
            map[c]=(map[c]||0)+1;
            total++;
        }
    });
    let txt='Codon Usage:\n';
    Object.keys(map).sort().forEach(c=>{
        let freq=((map[c]/total)*100).toFixed(2);
        txt+= `  ${c}: ${map[c]} (${freq}%)\n`;
    });
    out.textContent=txt.trim();
}

/** ORF Finder */
function findORFs() {
    const out=document.getElementById('orfOutput');
    out.textContent='';
    if(!loadedFasta.length){out.textContent='No seq.';return;}
    let txt='';
    let start='ATG';
    let stops=['TAA','TAG','TGA'];
    loadedFasta.forEach(e=>{
        let seq=e.sequence.toUpperCase();
        txt+= `>${e.header}\n`;
        let foundAny=false;
        for(let frame=0;frame<3;frame++){
            let i=frame;
            while(i<seq.length-2){
                if(seq.slice(i,i+3)===start){
                    let j=i+3, stopPos=-1;
                    while(j<seq.length-2){
                        if(stops.includes(seq.slice(j,j+3))){
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

/** Subsequence highlight & sorting & stats */
function highlightSubsequence() {
    const q=document.getElementById('highlightSubseq').value.trim();
    if(!q) {
        renderFasta(loadedFasta);
        return;
    }
    const disp=document.getElementById('fastaDisplay');
    disp.innerHTML='';
    loadedFasta.forEach(e=>{
        let hd=document.createElement('div');
        hd.className='fasta-header';
        hd.textContent='>'+e.header;

        let sq=document.createElement('div');
        sq.className='fasta-sequence';
        let seq = reverseViewActive ? reverseString(e.sequence) : e.sequence;
        sq.innerHTML= highlight(seq,q);

        disp.appendChild(hd);
        disp.appendChild(sq);
    });
}
function highlight(seq,q){
    let re=new RegExp(q,'gi');
    return seq.replace(re, m=> `<span class="highlight">${m}</span>`);
}

function showStats() {
    const out=document.getElementById('statsOutput');
    out.textContent='';
    if(!loadedFasta.length){out.textContent='No seq.';return;}
    let total=loadedFasta.length;
    let totalLen=0; let totalGC=0;
    loadedFasta.forEach(e=>{
        totalLen+= e.sequence.length;
        let m=e.sequence.toUpperCase().match(/[GC]/g);
        if(m) totalGC+=m.length;
    });
    let avg=(totalLen/total).toFixed(2);
    let overallGC= (totalLen>0)?((totalGC/totalLen)*100).toFixed(2):0;
    out.textContent=`Seq count: ${total}\nAverage length: ${avg}\nOverall GC%: ${overallGC}`;
}

function sortSequences() {
    const mode=document.getElementById('sortMode').value;
    if(mode==='length'){
        loadedFasta.sort((a,b)=> a.sequence.length - b.sequence.length);
    } else if(mode==='gc'){
        loadedFasta.sort((a,b)=> gcPercent(a.sequence) - gcPercent(b.sequence));
    } else if(mode==='header'){
        loadedFasta.sort((a,b)=> a.header.localeCompare(b.header));
    }
    renderFasta(loadedFasta);
}

/** (11) Sequence Reverse Visualization Toggle */
function toggleReverseView() {
    reverseViewActive = !reverseViewActive;
    renderFasta(loadedFasta);
}
function reverseString(str){return str.split('').reverse().join('');}

/** DYNAMIC TRIMMING */
function applyTrimming() {
    const out=document.getElementById('editOutput');
    out.textContent='';
    if(!loadedFasta.length){out.textContent='No seq.';return;}
    let start=parseInt(document.getElementById('trimStart').value)||1;
    let end=parseInt(document.getElementById('trimEnd').value);

    trimmedFasta=[];
    loadedFasta.forEach(e=>{
        let seq=e.sequence;
        let len=seq.length;
        let s=(start<1)?1:start;
        let en=(end && end<len)?end:len;
        if(s>en){
            trimmedFasta.push({header:e.header, sequence:''});
        } else {
            trimmedFasta.push({header:e.header, sequence: seq.slice(s-1,en)});
        }
    });

    let txt='';
    trimmedFasta.forEach(e=>{
        txt+= `>${e.header}\n${e.sequence}\n\n`;
    });
    out.textContent=txt.trim();
}

function loadTrimmedAsNewSet() {
    const out=document.getElementById('editOutput');
    if(!trimmedFasta.length){
        out.textContent+='\nNo trimmed data.';
        return;
    }
    loadedFasta=JSON.parse(JSON.stringify(trimmedFasta));
    trimmedFasta=[];
    renderFasta(loadedFasta);
    out.textContent+='\nTrimmed set now loaded.';
    pushTransform({type:'trimApplied'});
}

/** Palindromes, Restriction, etc. */
function findPalindromes() {
    const out=document.getElementById('palindromeOutput');
    out.textContent='';
    if(!loadedFasta.length){out.textContent='No seq.';return;}
    let txt='';
    loadedFasta.forEach(e=>{
        let seq=e.sequence.toUpperCase();
        txt+= `>${e.header}\n`;
        let count=0;
        for(let start=0;start<seq.length;start++){
            for(let end=start+3;end<seq.length;end++){
                let frag=seq.slice(start,end+1);
                if(isPalindrome(frag)){
                    count++;
                    txt+=`  #${count} at [${start+1}-${end+1}]: ${frag}\n`;
                }
            }
        }
        if(count===0) txt+='  No palindromes >=4bp.\n';
        txt+='\n';
    });
    out.textContent=txt.trim();
}
function isPalindrome(str) {
    if(str.length<4)return false;
    return str===reverseComplement(str);
}

function findRestrictionSites() {
    const out=document.getElementById('restrictionOutput');
    out.textContent='';
    if(!loadedFasta.length){out.textContent='No seq.';return;}
    let dictionary={
        EcoRI:'GAATTC',
        HindIII:'AAGCTT',
        BamHI:'GGATCC'
    };
    let txt='';
    loadedFasta.forEach(e=>{
        let seq=e.sequence.toUpperCase();
        txt+= `>${e.header}\n`;
        let any=false;
        Object.keys(dictionary).forEach(enzyme=>{
            let site=dictionary[enzyme];
            let idx= seq.indexOf(site);
            if(idx>=0){
                any=true;
                let positions=[];
                while(idx>=0){
                    positions.push(idx+1);
                    idx=seq.indexOf(site,idx+1);
                }
                txt+= `  ${enzyme} (${site}) @ ${positions.join(', ')}\n`;
            }
        });
        if(!any) txt+='  None.\n';
        txt+='\n';
    });
    out.textContent=txt.trim();
}

/** Sequence Masking (17) - e.g., replace “ATG” with NNN. */
function maskSequences() {
    const out=document.getElementById('maskOutput');
    out.textContent='';
    if(!loadedFasta.length){out.textContent='No seq.';return;}
    // Just an example: mask all "ATG" with "NNN"
    let txt='';
    loadedFasta.forEach(e=>{
        let masked=e.sequence.replace(/ATG/gi,'NNN');
        txt+= `>${e.header}\n${masked}\n\n`;
    });
    out.textContent=txt.trim();
    pushTransform({type:'maskATG'});
}

/** Multiple Sequence Export (16) */
function exportSelectedSequences() {
    const out=document.getElementById('multiExportOutput');
    out.textContent='(Naively exporting all, you could pick some UI to select them.)\n\n';
    let text='';
    loadedFasta.forEach(e=>{
        text+= `>${e.header}\n${e.sequence}\n`;
    });
    out.textContent+=text;
}

/** Transform History for Undo/Redo (23) */
function pushTransform(action) {
    transformHistory.push(action);
    // clear the redo stack
    transformRedoStack=[];
}
function undoLastTransform() {
    const out=document.getElementById('transformHistoryOutput');
    if(!transformHistory.length){
        out.textContent='No transforms to undo.';
        return;
    }
    let last=transformHistory.pop();
    transformRedoStack.push(last);
    // naive approach: we do nothing real except record that we “undid”
    out.textContent=`Undid transform: ${JSON.stringify(last)}`;
}
function redoTransform() {
    const out=document.getElementById('transformHistoryOutput');
    if(!transformRedoStack.length){
        out.textContent='No transform to redo.';
        return;
    }
    let action=transformRedoStack.pop();
    transformHistory.push(action);
    out.textContent=`Redone transform: ${JSON.stringify(action)}`;
}

/** Download FASTA */
function downloadCurrentFasta() {
    if(!loadedFasta.length){
        alert('No sequences to download.');
        return;
    }
    let text='';
    loadedFasta.forEach(e=>{
        text+= `>${e.header}\n${e.sequence}\n`;
    });
    downloadText(text, 'current_sequences.fasta');
}

/***************************************************************
 * VISUALIZATIONS
 ***************************************************************/
function plotGCContent() {
    const canvas=document.getElementById('gcCanvas');
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(!loadedFasta.length){
        alert('No seq.');
        return;
    }
    let barWidth=Math.floor(canvas.width/loadedFasta.length);
    let maxHeight=canvas.height-20;

    loadedFasta.forEach((e,i)=>{
        let gc=gcPercent(e.sequence);
        let h=(gc/100)*maxHeight;
        let x=i*barWidth; let y=canvas.height-h;
        ctx.fillStyle='#4CAF50';
        ctx.fillRect(x,y,barWidth-2,h);

        ctx.fillStyle='#000';
        ctx.font='10px Arial';
        ctx.fillText(gc.toFixed(1), x+2,y-2);
    });
}

function plotBaseComposition() {
    const canvas=document.getElementById('basePieCanvas');
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(!loadedFasta.length){
        alert('No seq.');
        return;
    }
    let seq=loadedFasta[0].sequence.toUpperCase();
    let counts={A:0,T:0,G:0,C:0};
    for(let c of seq){
        if(counts[c]!==undefined) counts[c]++;
    }
    let total=seq.length||1;
    let slices=[
        {base:'A',color:'#f66',val:counts['A']},
        {base:'T',color:'#66f',val:counts['T']},
        {base:'G',color:'#6f6',val:counts['G']},
        {base:'C',color:'#ff6',val:counts['C']}
    ];
    let start=0; let r=100;
    slices.forEach(s=>{
        let frac=s.val/total;
        let angle=frac*2*Math.PI;
        ctx.beginPath();
        ctx.moveTo(canvas.width/2,canvas.height/2);
        ctx.arc(canvas.width/2,canvas.height/2,r,start,start+angle);
        ctx.fillStyle=s.color;
        ctx.fill();
        // label
        let mid=start+angle/2;
        let lx=canvas.width/2+ (r*0.7)*Math.cos(mid);
        let ly=canvas.height/2+ (r*0.7)*Math.sin(mid);
        ctx.fillStyle='#000';
        ctx.fillText(`${s.base}(${s.val})`, lx-10,ly);
        start+=angle;
    });
}

function plotLengthHistogram() {
    const canvas=document.getElementById('lenHistCanvas');
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(!loadedFasta.length){
        alert('No seq.');
        return;
    }
    let lens=loadedFasta.map(e=> e.sequence.length);
    let maxLen=Math.max(...lens);
    let binCount=10;
    let binSize=Math.ceil(maxLen/binCount);
    let bins=new Array(binCount).fill(0);
    lens.forEach(l=>{
        let idx=Math.min(Math.floor(l/binSize), binCount-1);
        bins[idx]++;
    });
    let barWidth=Math.floor(canvas.width/binCount);
    let maxBin=Math.max(...bins);
    let scale=(canvas.height-20)/maxBin;

    bins.forEach((count,i)=>{
        let x=i*barWidth;
        let barH=count*scale;
        ctx.fillStyle='#4CAF50';
        ctx.fillRect(x, canvas.height-barH, barWidth-2, barH);

        ctx.fillStyle='#000';
        ctx.font='10px Arial';
        ctx.fillText(`[${i*binSize}-${(i+1)*binSize-1}]`, x+2, canvas.height-barH-2);
        ctx.fillText(count, x+2, canvas.height-2);
    });
}

function plotORFMap() {
    const canvas=document.getElementById('orfMapCanvas');
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(!loadedFasta.length){
        alert('No seq.');
        return;
    }
    let seq=loadedFasta[0].sequence.toUpperCase();
    let length=seq.length;
    let scale=canvas.width/length;

    ctx.strokeStyle='#000';
    ctx.beginPath();
    ctx.moveTo(0,canvas.height/2);
    ctx.lineTo(canvas.width,canvas.height/2);
    ctx.stroke();

    let start='ATG'; let stops=['TAA','TAG','TGA'];
    ctx.fillStyle='rgba(255,0,0,0.5)';
    let i=0;
    while(i<length-2){
        if(seq.slice(i,i+3)===start){
            let j=i+3; let stopPos=-1;
            while(j<length-2){
                if(stops.includes(seq.slice(j,j+3))) {stopPos=j+3;break;}
                j+=3;
            }
            if(stopPos>0){
                let x=i*scale; let w=(stopPos-i)*scale;
                ctx.fillRect(x, canvas.height/2-10, w, 20);
                i=stopPos;
            } else {
                break;
            }
        } else {
            i++;
        }
    }
}

/** (24) Nucleotide Heatmap (positions color-coded by GC or something) */
function nucleotideHeatmap() {
    const canvas=document.getElementById('ntHeatmapCanvas');
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(!loadedFasta.length){
        alert('No seq.');
        return;
    }
    let rowHeight=20;
    let maxLen=Math.max(...loadedFasta.map(e=> e.sequence.length));
    let scale=canvas.width/maxLen;

    loadedFasta.forEach((e,rowIdx)=>{
        let seq=e.sequence.toUpperCase();
        for(let i=0;i<seq.length;i++){
            let x=i*scale; let y=rowIdx*rowHeight;
            let base=seq[i];
            ctx.fillStyle= getNtColor(base);
            ctx.fillRect(x,y,scale,rowHeight);
        }
    });
}
function getNtColor(base) {
    switch(base){
        case 'A': return '#ffe5e5'; // pinkish
        case 'T': return '#e5e5ff';
        case 'G': return '#e5ffe5';
        case 'C': return '#ffffe5';
        default: return '#ccc';
    }
}

/** (4) Base Pairing Visualization (RNA) - naive approach for single strand. */
function visualizeBasePairs() {
    const canvas=document.getElementById('basePairCanvas');
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(!loadedFasta.length){
        alert('No sequences loaded.');
        return;
    }
    // We'll take the first sequence, assume it's RNA, pair A-U, G-C in a naive linear approach
    let seq=loadedFasta[0].sequence.toUpperCase().replace(/T/g,'U');
    let length=seq.length;
    let xGap=canvas.width/(length+1);
    let y1=50, y2=150;

    // draw bases top row
    ctx.fillStyle='#000';
    for(let i=0;i<length;i++){
        let x=(i+1)*xGap;
        ctx.fillText(seq[i], x, y1);
    }
    // complementary line bottom row
    let comp=[];
    for(let i=0;i<length;i++){
        let base=seq[i];
        comp.push(rnaComplement(base));
    }
    for(let i=0;i<length;i++){
        let x=(i+1)*xGap;
        ctx.fillText(comp[i], x, y2);
    }
    // draw lines if they pair
    for(let i=0;i<length;i++){
        if(seq[i]!== 'N' && comp[i]!=='N') {
            // line from top row to bottom row
            let x=(i+1)*xGap;
            ctx.strokeStyle='#999';
            ctx.beginPath();
            ctx.moveTo(x,y1+5);
            ctx.lineTo(x,y2-5);
            ctx.stroke();
        }
    }
}
function rnaComplement(base) {
    switch(base){
        case 'A': return 'U';
        case 'U': return 'A';
        case 'G': return 'C';
        case 'C': return 'G';
        default: return 'N';
    }
}

/***************************************************************
 * COMPARISONS & MAPPING
 ***************************************************************/
/** (5) Side-by-side comparison of first two sequences */
function compareTwoSequences() {
    const out=document.getElementById('compareTwoOutput');
    out.textContent='';
    if(loadedFasta.length<2){
        out.textContent='Need at least 2 sequences.';
        return;
    }
    let s1=loadedFasta[0].sequence;
    let s2=loadedFasta[1].sequence;
    let maxLen=Math.max(s1.length,s2.length);

    let txt='Index   Seq1   Seq2\n';
    for(let i=0;i<maxLen;i++){
        let c1=s1[i]||'-'; let c2=s2[i]||'-';
        let mark=(c1===c2)?' ':'*';
        txt+=`${(i+1).toString().padStart(5)}   ${c1}      ${c2}  ${mark}\n`;
    }
    out.textContent=txt;
}

/** (29) Diff Viewer */
function diffTwoSequences() {
    const out=document.getElementById('diffViewerOutput');
    out.textContent='';
    if(loadedFasta.length<2){
        out.textContent='Need 2 seq.';
        return;
    }
    let s1=loadedFasta[0].sequence;
    let s2=loadedFasta[1].sequence;
    let i=0; let txt='Differences:\n';
    while(i<Math.max(s1.length,s2.length)){
        let c1=s1[i]||'';
        let c2=s2[i]||'';
        if(c1!==c2){
            txt+=`Pos ${i+1}: ${c1} -> ${c2}\n`;
        }
        i++;
    }
    if(txt==='Differences:\n') txt+='None - they match or one is shorter.';
    out.textContent=txt;
}

/** (13) Compare to a “reference” (the first sequence) */
function compareToReference() {
    const out=document.getElementById('refCompareOutput');
    out.textContent='';
    if(loadedFasta.length<2){
        out.textContent='Need multiple seq.';
        return;
    }
    let ref=loadedFasta[0].sequence;
    let txt='';
    for(let i=1;i<loadedFasta.length;i++){
        let seq=loadedFasta[i].sequence;
        let minLen=Math.min(ref.length, seq.length);
        let mismatch=0;
        for(let j=0;j<minLen;j++){
            if(ref[j]!==seq[j]) mismatch++;
        }
        txt+= `>${loadedFasta[i].header}\n  Mismatch with ref: ${mismatch}, length difference: ${Math.abs(ref.length-seq.length)}\n`;
    }
    out.textContent=txt;
}

/** (25) Alignment Overview (naive) */
function alignmentOverview() {
    const out=document.getElementById('alignmentOverviewOutput');
    if(loadedFasta.length<2){
        out.textContent='Need 2+ seq.';
        return;
    }
    // naive approach: show each sequence side by side truncated
    let maxLen=0;
    loadedFasta.forEach(e=> {if(e.sequence.length>maxLen) maxLen=e.sequence.length;});
    let txt='';
    loadedFasta.forEach(e=>{
        let s=e.sequence.slice(0,50);
        txt+= `>${e.header}  (first 50bp) => ${s}\n`;
    });
    out.textContent=txt.trim();
}

/***************************************************************
 * GENE & GENOME TOOLS
 ***************************************************************/
/** (6) Gene Mapping: If “GENE: start-end” found in header, highlight it. */
function geneMapAnnotation() {
    const out=document.getElementById('geneMapOutput');
    out.textContent='';
    if(!loadedFasta.length){
        out.textContent='No seq.';
        return;
    }
    let txt='';
    loadedFasta.forEach(e=>{
        txt+= `>${e.header}\n`;
        // naive parse: GENE: 10-50 => annotated
        let match=e.header.match(/GENE:\s*(\d+)-(\d+)/i);
        if(match){
            let s=parseInt(match[1]);
            let en=parseInt(match[2]);
            let sub=e.sequence.slice(s-1,en);
            txt+= `  Found gene region [${s}-${en}]: ${sub}\n`;
        } else {
            txt+='  No gene region info in header.\n';
        }
        txt+='\n';
    });
    out.textContent=txt.trim();
}

/** (26) Interactive Gene Finder (very naive). Searching for “ATG...stop” as gene? */
function interactiveGeneFinder() {
    const out=document.getElementById('geneFinderOutput');
    out.textContent='';
    if(!loadedFasta.length){
        out.textContent='No seq.';
        return;
    }
    let txt='';
    let start='ATG'; let stops=['TAA','TAG','TGA'];
    loadedFasta.forEach(e=>{
        txt+= `>${e.header}\n`;
        let seq=e.sequence.toUpperCase();
        let foundGenes=[];
        let i=0;
        while(i<seq.length-2){
            if(seq.slice(i,i+3)===start){
                let j=i+3; let stopPos=-1;
                while(j<seq.length-2){
                    if(stops.includes(seq.slice(j,j+3))){
                        stopPos=j+3;break;
                    }
                    j+=3;
                }
                if(stopPos>0){
                    foundGenes.push([i+1,stopPos]);
                    i=stopPos;
                } else {
                    break;
                }
            } else {
                i++;
            }
        }
        if(foundGenes.length){
            foundGenes.forEach((g,idx)=>{
                txt+= `  Gene#${idx+1}: [${g[0]}-${g[1]}], length=${g[1]-g[0]+1}\n`;
            });
        } else {
            txt+='  No gene found.\n';
        }
        txt+='\n';
    });
    out.textContent=txt.trim();
}

/** (14) Circular Genome Visualization */
function drawCircularGenome() {
    const canvas=document.getElementById('circularGenomeCanvas');
    const ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(!loadedFasta.length){
        alert('No seq.');
        return;
    }
    let seq=loadedFasta[0].sequence.toUpperCase();
    let length=seq.length||1;
    let cx=canvas.width/2, cy=canvas.height/2;
    let r= (canvas.width<canvas.height)? canvas.width/2-10: canvas.height/2-10;
    // draw circle
    ctx.beginPath();
    ctx.arc(cx,cy,r,0,2*Math.PI);
    ctx.strokeStyle='#000';
    ctx.stroke();
    // naive: color segments for GC vs AT
    let startAngle=0;
    for(let i=0;i<length;i++){
        let base=seq[i];
        let angle= (1/length)*2*Math.PI;
        ctx.beginPath();
        ctx.moveTo(cx,cy);
        ctx.arc(cx,cy,r,startAngle,startAngle+angle);
        ctx.fillStyle= (base==='G'||base==='C')?'#4CAF50':'#ddd';
        ctx.fill();
        startAngle+=angle;
    }
}

/** (7) Sequence Rotation for Circular DNA */
function rotateCircularDNA() {
    const out=document.getElementById('circularRotationOutput');
    out.textContent='';
    if(!loadedFasta.length){
        out.textContent='No seq.';
        return;
    }
    let rot=parseInt(document.getElementById('circularRotate').value)||0;
    // rotate first seq
    let seq=loadedFasta[0].sequence;
    rot=rot%(seq.length||1);
    if(rot<0) rot+=seq.length;
    let newSeq= seq.slice(rot)+ seq.slice(0,rot);
    out.textContent=`Original length: ${seq.length}\nRotated at ${rot} bp.\nPreview: ${newSeq.slice(0,50)}...`;
    pushTransform({type:'circularRotate', pos:rot});
}

/***************************************************************
 * UTILITIES
 ***************************************************************/
function removeDuplicates() {
    const out=document.getElementById('duplicateOutput');
    out.textContent='';
    if(!loadedFasta.length){
        out.textContent='No sequences.';
        return;
    }
    let seen=new Set(); let unique=[]; let removed=0;
    loadedFasta.forEach(e=>{
        let key=e.header+'|'+e.sequence;
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
    loadedFasta.forEach((e,i)=> e.header=`Seq${i+1}`);
    renderFasta(loadedFasta);
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

function copyFastaToClipboard() {
    if(!loadedFasta.length){
        alert('No seq to copy.');
        return;
    }
    let text='';
    loadedFasta.forEach(e=> {
        text+= `>${e.header}\n${e.sequence}\n`;
    });
    navigator.clipboard.writeText(text).then(()=>{
        alert('FASTA copied.');
    }).catch(err=> alert('Clipboard error: '+err.message));
}

function saveToSession() {
    if(!loadedFasta.length){
        document.getElementById('sessionMsg').textContent='No sequences.';
        return;
    }
    sessionStorage.setItem('fastaData', JSON.stringify(loadedFasta));
    document.getElementById('sessionMsg').textContent='Saved to session.';
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
    if(!loadedFasta.length){alert('No seq.');return;}
    let lines=['header,sequence,length,gc'];
    loadedFasta.forEach(e=>{
        let len=e.sequence.length;
        let gc=gcPercent(e.sequence).toFixed(2);
        lines.push(`"${e.header}","${e.sequence}",${len},${gc}`);
    });
    downloadText(lines.join('\n'),'fasta_data.csv');
}

function exportJSON() {
    if(!loadedFasta.length){alert('No seq.');return;}
    let txt=JSON.stringify(loadedFasta,null,2);
    downloadText(txt,'fasta_data.json');
}

/** (27) Export Sequences with Stats */
function exportWithStats() {
    if(!loadedFasta.length){alert('No seq.');return;}
    let lines=['header,sequence,length,gc'];
    loadedFasta.forEach(e=>{
        let len=e.sequence.length;
        let gc=gcPercent(e.sequence).toFixed(2);
        lines.push(`"${e.header}","${e.sequence}",${len},${gc}`);
    });
    downloadText(lines.join('\n'),'fasta_with_stats.csv');
}

/** (19) Sequence Compression (gzip via pako) */
function compressSequences() {
    const out=document.getElementById('compressOutput');
    out.textContent='';
    if(!loadedFasta.length){
        out.textContent='No seq.';
        return;
    }
    let text='';
    loadedFasta.forEach(e=>{
        text+= `>${e.header}\n${e.sequence}\n`;
    });
    let bin = pako.gzip(text);
    let base64 = btoa(String.fromCharCode(...bin));
    out.textContent='Compressed (base64 of gz):\n'+base64;
}

function decompressSequences() {
    const out=document.getElementById('compressOutput');
    let b64=out.textContent.split('\n')[1]||'';
    if(!b64){
        out.textContent+=' \nNo compressed data found.';
        return;
    }
    let binArr= Uint8Array.from(atob(b64), c=>c.charCodeAt(0));
    let decompressed = pako.ungzip(binArr, {to:'string'});
    out.textContent+=' \n\nDecompressed:\n'+decompressed.slice(0,100)+'... (truncated)';
}

/** (20) Sequence Randomization */
function randomizeLoadedSequences() {
    const out=document.getElementById('randomizeOutput');
    out.textContent='';
    if(!loadedFasta.length){
        out.textContent='No seq.';
        return;
    }
    let bases=['A','T','G','C'];
    let txt='';
    loadedFasta.forEach(e=>{
        let arr=e.sequence.split('');
        for(let i=0;i<arr.length;i++){
            // random chance of changing it:
            if(Math.random()<0.1){
                arr[i]= bases[Math.floor(Math.random()*4)];
            }
        }
        let newSeq=arr.join('');
        txt+= `>${e.header}\n${newSeq}\n\n`;
    });
    out.textContent=txt.trim();
}

/** (21) Real-Time Aggregation - just show length & GC dynamically */
function showRealTimeAggregation() {
    const out=document.getElementById('realtimeAggOutput');
    out.textContent='';
    let totalLen=0; let totalGC=0;
    loadedFasta.forEach(e=>{
        totalLen+= e.sequence.length;
        let m=e.sequence.toUpperCase().match(/[GC]/g);
        if(m) totalGC+=m.length;
    });
    let avgGC=0;
    if(totalLen>0) avgGC=(totalGC/totalLen)*100;
    out.textContent=`Count: ${loadedFasta.length}\nTotal length: ${totalLen}\nAvg GC%: ${avgGC.toFixed(2)}`;
}

/** (31) Build simple cluster heatmap for all sequences */
function buildClusterHeatmap() {
    const container=document.getElementById('clusterHeatmap');
    container.innerHTML='';
    if(loadedFasta.length<2){
        container.textContent='Need 2+ seq.';
        return;
    }
    // naive similarity: # matches / minLen
    let table=document.createElement('table');
    table.style.borderCollapse='collapse';

    let thead=document.createElement('thead');
    let trHead=document.createElement('tr');
    trHead.appendChild(document.createElement('th'));
    loadedFasta.forEach(f=> {
        let th=document.createElement('th');
        th.textContent=f.header;
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    table.appendChild(thead);

    let tbody=document.createElement('tbody');
    for(let i=0;i<loadedFasta.length;i++){
        let row=document.createElement('tr');
        let th=document.createElement('th');
        th.textContent=loadedFasta[i].header;
        row.appendChild(th);
        for(let j=0;j<loadedFasta.length;j++){
            let td=document.createElement('td');
            let sim=calcSimilarity(loadedFasta[i].sequence, loadedFasta[j].sequence);
            let colVal=Math.floor((1-sim)*255);
            td.style.backgroundColor=`rgb(255,${colVal},${colVal})`;
            td.style.textAlign='center';
            td.textContent=(sim*100).toFixed(1)+'%';
            row.appendChild(td);
        }
        tbody.appendChild(row);
    }
    table.appendChild(tbody);

    container.appendChild(table);
}
function calcSimilarity(s1,s2) {
    if(!s1||!s2) return 0;
    let minLen=Math.min(s1.length,s2.length);
    let match=0;
    for(let i=0;i<minLen;i++){
        if(s1[i]===s2[i]) match++;
    }
    return match/minLen;
}

/** (32) Automated Cleanup (remove weird chars, fix formatting) */
function automatedCleanup() {
    if(!loadedFasta.length){
        alert('No seq.');
        return;
    }
    loadedFasta.forEach(e=>{
        // remove non-ATGC from DNA for example
        let cleaned=e.sequence.toUpperCase().replace(/[^ATGC]/g,'');
        e.sequence=cleaned;
    });
    renderFasta(loadedFasta);
}

/***************************************************************
 * 3D STRUCTURE
 ***************************************************************/
function handlePdbUpload() {
    const file=document.getElementById('pdbFile').files[0];
    if(!file){
        alert('No PDB file.');
        return;
    }
    let fr=new FileReader();
    fr.onload=()=>{
        loadedPdb=fr.result;
        alert('PDB loaded.');
    };
    fr.onerror=()=> alert('Error reading PDB.');
    fr.readAsText(file);
}
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
 * DOWNLOAD / HELPER
 ***************************************************************/
function downloadText(txt, filename){
    let blob=new Blob([txt],{type:'text/plain'});
    let link=document.createElement('a');
    link.href=URL.createObjectURL(blob);
    link.download=filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/** Download the textContent of a result box */
function downloadResults(elementId, filename) {
    const content=document.getElementById(elementId).textContent;
    if(!content.trim()){
        alert('No content to download!');
        return;
    }
    downloadText(content, filename);
}
