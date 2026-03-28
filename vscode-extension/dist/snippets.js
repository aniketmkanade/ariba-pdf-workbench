"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AribaSnippetProvider = void 0;
const vscode = __importStar(require("vscode"));
class AribaSnippetProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    snippets = [
        new SnippetItem('Invoice Header (Logo Left)', 'Standard Ariba centered header with logo', `<fo:block-container position="absolute" top="0cm" left="0cm">
    <fo:block>
        <fo:external-graphic src="url('assets/ariba-logo.png')" content-height="1.5cm"/>
    </fo:block>
</fo:block-container>
<fo:block text-align="center" font-size="18pt" font-weight="bold" margin-top="1cm">
    INVOICE
</fo:block>`, vscode.TreeItemCollapsibleState.None, 'header'),
        new SnippetItem('Dynamic Table (LineItems)', 'Repeating table for invoice lines', `<fo:table table-layout="fixed" width="100%" border-collapse="separate">
    <fo:table-column column-width="2cm"/>
    <fo:table-column column-width="10cm"/>
    <fo:table-column column-width="4cm"/>
    <fo:table-header>
        <fo:table-row font-weight="bold" background-color="#003366" color="white">
            <fo:table-cell padding="2pt"><fo:block>Qty</fo:block></fo:table-cell>
            <fo:table-cell padding="2pt"><fo:block>Description</fo:block></fo:table-cell>
            <fo:table-cell padding="2pt"><fo:block>Price</fo:block></fo:table-cell>
        </fo:table-row>
    </fo:table-header>
    <fo:table-body>
        <xsl:for-each select="LineItems/LineItem">
            <fo:table-row border-bottom="0.5pt solid #cccccc">
                <fo:table-cell padding="2pt"><fo:block><xsl:value-of select="Quantity"/></fo:block></fo:table-cell>
                <fo:table-cell padding="2pt"><fo:block><xsl:value-of select="Description"/></fo:block></fo:table-cell>
                <fo:table-cell padding="2pt" text-align="right"><fo:block><xsl:value-of select="UnitPrice"/></fo:block></fo:table-cell>
            </fo:table-row>
        </xsl:for-each>
    </fo:table-body>
</fo:table>`, vscode.TreeItemCollapsibleState.None, 'table'),
        new SnippetItem('Conditional Style (Negative Total)', 'Red text for negative amounts', `<fo:block color="{if (TotalAmount < 0) then 'red' else 'black'}" font-weight="bold">
    <xsl:value-of select="format-number(TotalAmount, '$#,##0.00')"/>
</fo:block>`, vscode.TreeItemCollapsibleState.None, 'logic'),
        new SnippetItem('Page Numbering (Footer)', 'X of Y page numbering', `<fo:block text-align="center" font-size="9pt">
    Page <fo:page-number/> of <fo:page-number-citation ref-id="last-page"/>
</fo:block>`, vscode.TreeItemCollapsibleState.None, 'footer')
    ];
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element)
            return Promise.resolve([]);
        return Promise.resolve(this.snippets);
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
}
exports.AribaSnippetProvider = AribaSnippetProvider;
class SnippetItem extends vscode.TreeItem {
    label;
    description;
    snippet;
    collapsibleState;
    contextValue;
    constructor(label, description, snippet, collapsibleState, contextValue) {
        super(label, collapsibleState);
        this.label = label;
        this.description = description;
        this.snippet = snippet;
        this.collapsibleState = collapsibleState;
        this.contextValue = contextValue;
        this.tooltip = this.description;
        this.iconPath = new vscode.ThemeIcon('symbol-snippet');
        this.command = {
            command: 'ariba-pdf-preview.insertSnippet',
            title: 'Insert Snippet',
            arguments: [this.snippet]
        };
    }
}
//# sourceMappingURL=snippets.js.map