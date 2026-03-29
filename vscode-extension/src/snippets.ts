import * as vscode from 'vscode';

export class AribaSnippetProvider implements vscode.TreeDataProvider<SnippetItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<SnippetItem | undefined | null | void> = new vscode.EventEmitter<SnippetItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<SnippetItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private snippets: SnippetItem[] = [
        new SnippetItem(
            'Invoice Header (Logo Left)',
            'Standard Ariba centered header with logo',
            `<fo:block-container position="absolute" top="0cm" left="0cm">
    <fo:block>
        <fo:external-graphic src="url('assets/ariba-logo.png')" content-height="1.5cm"/>
    </fo:block>
</fo:block-container>
<fo:block text-align="center" font-size="18pt" font-weight="bold" margin-top="1cm">
    INVOICE
</fo:block>`,
            vscode.TreeItemCollapsibleState.None,
            'header'
        ),
        new SnippetItem(
            'Dynamic Table (LineItems)',
            'Repeating table for invoice lines',
            `<fo:table table-layout="fixed" width="100%" border-collapse="separate">
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
</fo:table>`,
            vscode.TreeItemCollapsibleState.None,
            'table'
        ),
        new SnippetItem(
            'Conditional Style (Negative Total)',
            'Red text for negative amounts',
            `<fo:block color="{if (TotalAmount < 0) then 'red' else 'black'}" font-weight="bold">
    <xsl:value-of select="format-number(TotalAmount, '$#,##0.00')"/>
</fo:block>`,
            vscode.TreeItemCollapsibleState.None,
            'logic'
        ),
        new SnippetItem(
            'Page Numbering (Footer)',
            'X of Y page numbering',
            `<fo:block text-align="center" font-size="9pt">
    Page <fo:page-number/> of <fo:page-number-citation ref-id="last-page"/>
</fo:block>`,
            vscode.TreeItemCollapsibleState.None,
            'footer'
        ),
        new SnippetItem(
            'HU Hierarchy (Nested)',
            'Recursive grouping for Handling Units',
            `<fo:block border-left="2pt solid #003366" padding-left="10pt" margin-bottom="5pt">
    <fo:block font-weight="bold" font-size="11pt" color="#003366">
        Handling Unit: <xsl:value-of select="@huID"/> (<xsl:value-of select="@type"/>)
    </fo:block>
    <fo:block font-size="9pt">Weight: <xsl:value-of select="Weight"/> <xsl:value-of select="Weight/@unit"/></fo:block>
    <!-- Recursive call for children HUs -->
    <xsl:apply-templates select="HandlingUnit"/>
    <xsl:for-each select="Contents/Item">
        <fo:block font-style="italic" margin-left="10pt">• Item: <xsl:value-of select="@itemID"/> (Qty: <xsl:value-of select="@quantity"/>)</fo:block>
    </xsl:for-each>
</fo:block>`,
            vscode.TreeItemCollapsibleState.None,
            'asn'
        ),
        new SnippetItem(
            'Tax Calculation Row',
            'Dynamic tax calculation and row display',
            `<fo:table-row border-top="1pt solid #444">
    <fo:table-cell padding="4pt" number-columns-spanned="2">
        <fo:block text-align="right" font-weight="bold">Tax (15%):</fo:block>
    </fo:table-cell>
    <fo:table-cell padding="4pt">
        <fo:block font-weight="bold">
            <xsl:value-of select="format-number(TotalAmount * 0.15, '$#,##0.00')"/>
        </fo:block>
    </fo:table-cell>
</fo:table-row>`,
            vscode.TreeItemCollapsibleState.None,
            'po'
        )
    ];

    getTreeItem(element: SnippetItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SnippetItem): Promise<SnippetItem[]> {
        if (element) return Promise.resolve([]);
        return Promise.resolve(this.snippets);
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
}

class SnippetItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly description: string,
        public readonly snippet: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string
    ) {
        super(label, collapsibleState);
        this.tooltip = this.description;
        this.iconPath = new vscode.ThemeIcon('symbol-snippet');
        this.command = {
            command: 'ariba-pdf-preview.insertSnippet',
            title: 'Insert Snippet',
            arguments: [this.snippet]
        };
    }
}
