# BioInfo

A lightweight and user-friendly tool for analyzing and managing FASTA files. With features for sequence analysis, visualization, and editing, **FastaSequenceCounter** is a versatile solution for bioinformatics enthusiasts and professionals alike.

> "Everyone who is seriously involved in the pursuit of science becomes convinced that a spirit is manifest in the laws of the Universe."\
> *\~Albert Einstein*

---

## 🌟 Features

### Input & Setup

- **Upload FASTA**: Drag-and-drop multiple `.fasta` or `.txt` files.
- **Fetch FASTA**: Load sequences directly from a URL.
- **Generate Random FASTA**: Create random sequences for testing and analysis.

### Sequence Analysis

- **Basic Information**: Displays loaded sequences, headers, and lengths.
- **Search & Filter**: Filter by headers or substrings within sequences.
- **Reverse Complement**: Compute reverse complement sequences.
- **GC Content**: Calculate GC percentage for sequences.
- **Motif Search**: Identify motif positions and counts.
- **Transcription & Translation**: Generate RNA and protein sequences, analyze codon usage, and identify ORFs.
- **Subsequence Highlighting**: Highlight specific regions within sequences.
- **Stats & Sorting**: Sort sequences by length, composition, or GC content.
- **Editing & Trimming**: Trim sequences dynamically and process trimmed sets.
- **Palindrome Finder**: Locate palindromic sequences.
- **Restriction Sites**: Identify enzyme restriction sites.
- **Export Options**: Download the current dataset in FASTA, CSV, or JSON format.

### Visualization

- **GC Content Bar Chart**: Visualize GC content distribution.
- **Base Composition Pie Chart**: Analyze nucleotide composition.
- **Length Histogram**: Explore sequence length distributions.
- **ORF Map**: Visualize open reading frames for the first sequence.

### 3D Structure

- **PDB File Support**: Upload and render 3D molecular structures with 3Dmol.js.

### Utilities

- **Remove Duplicates**: Eliminate duplicate sequences.
- **Rename Headers**: Customize sequence headers.
- **Clipboard Copy**: Quickly copy sequences to your clipboard.
- **Session Storage**: Save and restore your session for continued work.

### Handling Large FASTA Files

- **Chunked Loading**: Efficiently process files up to 50–100 MB by reading in 1 MB slices with real-time progress indicators.
- **Dynamic Trimming**: Trim sequences by specifying start and end positions (1-based). Load trimmed sets for further analysis or download them as new FASTA files.

---

## 🎒 Tech Stack

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)

---

## 🚀 Access It Here

**[BioInfo](rajkanwars15.github.io/BioInfo/)**

---

## 🖥️ Run Locally

To run the project locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/rajkanwars15/BioInfo.git
   ```
2. Navigate to the project directory:
   ```bash
   cd BioInfo
   ```
3. Open the `index.html` file in your browser:
   ```bash
   open index.html
   ```

---

## 🔄 Upcoming Updates

- Will look for other pure front end features helpful in research
- Will explore an appropriate backend option for larger files.
- The focus is to get functionality right currently, visual enhancements are not an immediate plan.

> **Note**: This project was originally developed in Python and later transitioned to a pure HTML frontend for seamless, free hosting. 🫠

---

## 👨‍💻 Author

[![Static Badge](https://img.shields.io/badge/Rajkanwars15-yellow?logo=GitHub&link=https%3A%2F%2Fgithub.com%2FRajkanwars15)
](https://www.github.com/rajkanwars15)
---

Whatever my friend asks for, will be added as a feature ;-)