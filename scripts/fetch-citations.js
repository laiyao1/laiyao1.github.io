const fs = require('fs');
const https = require('https');
const path = require('path');

const OUTPUT_FILE = '_data/publications.json';
const PUBLICATIONS_DIR = '_publications';

// 延迟函数
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// 从 markdown 文件中提取标题和标识符
function extractMetadataFromMarkdown(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const titleMatch = content.match(/title:\s*"([^"]+)"/);
        const dateMatch = content.match(/date:\s*(\d{4})/);
        const doiMatch = content.match(/doi:\s*"?([^"\n]+)"?/i);
        const arxivMatch = content.match(/arxiv:\s*"?([^"\n]+)"?/i);
        
        if (titleMatch) {
            return {
                title: titleMatch[1],
                year: dateMatch ? dateMatch[1] : null,
                doi: doiMatch ? doiMatch[1].trim() : null,
                arxiv: arxivMatch ? arxivMatch[1].trim() : null
            };
        }
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
    }
    return null;
}

// 获取所有论文
function getAllPublications() {
    const publications = [];
    
    function readDir(dir) {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                readDir(fullPath);
            } else if (item.endsWith('.md')) {
                const data = extractMetadataFromMarkdown(fullPath);
                if (data && data.title) {
                    const id = path.basename(item, '.md');
                    publications.push({
                        id: id,
                        title: data.title,
                        year: data.year,
                        doi: data.doi,
                        arxiv: data.arxiv,
                        file: fullPath
                    });
                }
            }
        }
    }
    
    if (fs.existsSync(PUBLICATIONS_DIR)) {
        readDir(PUBLICATIONS_DIR);
    }
    
    return publications;
}

// 使用 Semantic Scholar API 通过 arXiv ID 获取
function fetchByArxiv(arxivId) {
    return new Promise((resolve, reject) => {
        const cleanArxivId = arxivId.replace('arXiv:', '').trim();
        const url = `https://api.semanticscholar.org/graph/v1/paper/arXiv:${encodeURIComponent(cleanArxivId)}?fields=citationCount,title,paperId,externalIds`;
        
        console.log(`  Searching by arXiv ID: ${cleanArxivId}`);
        
        const options = {
            headers: {
                'User-Agent': 'Academic-Website-Citation-Bot',
                'Accept': 'application/json',
                // 如果有 API Key，添加到请求头
                ...(API_KEY && { 'x-api-key': API_KEY })
            }
        };
        
        https.get(url, options, (res) => {
            let data = '';
            
            res.on('data', chunk => data += chunk);
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        resolve(json);
                    } catch (error) {
                        reject(new Error(`Parse error: ${error.message}`));
                    }
                } else if (res.statusCode === 404) {
                    resolve(null);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// 使用 Semantic Scholar API 通过 DOI 获取
function fetchByDOI(doi) {
    return new Promise((resolve, reject) => {
        const url = `https://api.semanticscholar.org/graph/v1/paper/DOI:${encodeURIComponent(doi)}?fields=citationCount,title,paperId,externalIds`;
        
        console.log(`  Searching by DOI: ${doi}`);
        
        const options = {
            headers: {
                'User-Agent': 'Academic-Website-Citation-Bot',
                'Accept': 'application/json',
                ...(API_KEY && { 'x-api-key': API_KEY })
            }
        };
        
        https.get(url, options, (res) => {
            let data = '';
            
            res.on('data', chunk => data += chunk);
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        resolve(json);
                    } catch (error) {
                        reject(new Error(`Parse error: ${error.message}`));
                    }
                } else if (res.statusCode === 404) {
                    resolve(null);
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// 使用 Semantic Scholar API 通过标题搜索
function fetchByTitle(title) {
    return new Promise((resolve, reject) => {
        const searchQuery = encodeURIComponent(title);
        const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${searchQuery}&fields=citationCount,title,paperId,externalIds&limit=5`;
        
        console.log(`  Searching by title: ${title.substring(0, 60)}...`);
        
        const options = {
            headers: {
                'User-Agent': 'Academic-Website-Citation-Bot',
                'Accept': 'application/json',
                ...(API_KEY && { 'x-api-key': API_KEY })
            }
        };
        
        https.get(url, options, (res) => {
            let data = '';
            
            res.on('data', chunk => data += chunk);
            
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const json = JSON.parse(data);
                        
                        if (json.data && json.data.length > 0) {
                            resolve(json.data[0]);
                        } else {
                            resolve(null);
                        }
                    } catch (error) {
                        reject(new Error(`Parse error: ${error.message}`));
                    }
                } else if (res.statusCode === 429) {
                    reject(new Error('Rate limit exceeded'));
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

// 获取单篇论文的 citation
async function fetchCitation(paper) {
    let retries = 3;
    
    while (retries > 0) {
        try {
            let result = null;
            
            // 查询优先级：arXiv ID > DOI > 标题搜索
            
            // 1. 优先使用 arXiv ID（最可靠）
            if (paper.arxiv) {
                result = await fetchByArxiv(paper.arxiv);
                if (result) {
                    console.log(`  ✓ Found by arXiv ID: ${result.citationCount} citations`);
                } else {
                    console.log(`  arXiv ID not found, trying DOI...`);
                }
            }
            
            // 2. 使用 DOI
            if (!result && paper.doi) {
                await delay(1000); // 避免请求过快
                result = await fetchByDOI(paper.doi);
                if (result) {
                    console.log(`  ✓ Found by DOI: ${result.citationCount} citations`);
                } else {
                    console.log(`  DOI not found, trying title search...`);
                }
            }
            
            // 3. 如果 DOI 没找到，使用标题搜索
            if (!result && paper.title) {
                await delay(1000);
                result = await fetchByTitle(paper.title);
                if (result) {
                    console.log(`  ✓ Found by title: ${result.citationCount} citations`);
                }
            }
            
            if (result) {
                return {
                    id: paper.id,
                    title: paper.title,
                    year: paper.year,
                    citations: result.citationCount || 0,
                    source: 'semantic_scholar',
                    s2_paper_id: result.paperId,
                    s2_title: result.title,
                    external_ids: result.externalIds,
                    updated: new Date().toISOString()
                };
            } else {
                console.log(`  ✗ Not found in Semantic Scholar`);
                return {
                    id: paper.id,
                    title: paper.title,
                    year: paper.year,
                    citations: null,
                    source: 'semantic_scholar',
                    error: 'Not found',
                    updated: new Date().toISOString()
                };
            }
            
        } catch (error) {
            retries--;
            
            if (error.message.includes('Rate limit')) {
                console.log(`  ⚠ Rate limited, waiting 10 seconds...`);
                await delay(10000);
            } else if (retries > 0) {
                console.log(`  ⚠ Error: ${error.message}, retrying... (${retries} left)`);
                await delay(2000);
            } else {
                console.log(`  ✗ Failed after retries: ${error.message}`);
                return {
                    id: paper.id,
                    title: paper.title,
                    year: paper.year,
                    citations: null,
                    source: 'semantic_scholar',
                    error: error.message,
                    updated: new Date().toISOString()
                };
            }
        }
    }
}

// 主函数
async function main() {
    try {
        console.log('=== Starting Publication Data Generation ===\n');
        
        const publications = getAllPublications();
        
        if (publications.length === 0) {
            console.log('No publications found!');
            console.log(`Checked directory: ${PUBLICATIONS_DIR}`);
            process.exit(1);
        }
        
        console.log(`Found ${publications.length} publication(s):\n`);
        publications.forEach((p, i) => {
            console.log(`${i + 1}. ${p.title}`);
            console.log(`   Year: ${p.year || 'N/A'}`);
            console.log(`   arXiv: ${p.arxiv || 'N/A'}`);
            console.log(`   DOI: ${p.doi || 'N/A'}`);
            console.log('');
        });
        
        const results = {};
        
        // 获取引用数据
        for (let i = 0; i < publications.length; i++) {
            const paper = publications[i];
            console.log(`[${i + 1}/${publications.length}] Processing: ${paper.id}`);
            
            const result = await fetchCitation(paper);
            results[paper.id] = result;
            
            if (i < publications.length - 1) {
                console.log(`  Waiting 3 seconds...\n`);
                await delay(3000);
            }
        }

        // 生成 publications.json（主文件）
        const publicationsData = publications.map(paper => {
            const citationData = results[paper.id];
            return {
                id: paper.id,
                title: paper.title,
                year: paper.year,
                citations: citationData.citations || 0,
                semantic_scholar: {
                    paper_id: citationData.s2_paper_id || null,
                    title: citationData.s2_title || null,
                    external_ids: citationData.external_ids || null
                },
                last_updated: citationData.updated
            };
        });

        const publicationsOutput = {
            last_updated: new Date().toISOString(),
            total_papers: publications.length,
            total_citations: publicationsData.reduce((sum, p) => sum + (p.citations || 0), 0),
            papers: publicationsData
        };
        
        // 确保 _data 目录存在
        const dir = '_data';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        // 写入文件
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(publicationsOutput, null, 2));
        
        console.log('\n=== Summary ===');
        console.log(`Output: ${OUTPUT_FILE}`);
        console.log(`Total papers: ${publications.length}`);
        console.log(`Total citations: ${publicationsOutput.total_citations}`);
        
        const successful = publicationsData.filter(p => p.citations !== null && p.citations > 0).length;
        const failed = publicationsData.filter(p => p.citations === null).length;
        
        console.log(`Papers with citations: ${successful}`);
        console.log(`Papers not found: ${failed}`);
        
        console.log('\nCitation details:');
        publicationsData.forEach(p => {
            if (p.citations !== null) {
                console.log(`  ${p.id}: ${p.citations} citations`);
            } else {
                console.log(`  ${p.id}: Not found`);
            }
        });
        
        console.log('\n✓ Done!');
        
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

main();