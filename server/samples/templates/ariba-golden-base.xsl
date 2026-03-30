<?xml version="1.0" encoding="UTF-8"?>
<!--
    ARIBAPDF-WORKBENCH: GOLDEN BASE TEMPLATE v1.0
    Use this as your starting point for all Ariba XSL-FO developments.
    
    BEST PRACTICES:
    1. Always use XSLT 1.0 (xsltproc requirement).
    2. Namespaces for FO and Ariba are mandatory.
    3. Use fo:layout-master-set to define layout once (header/footer heights).
-->
<xsl:stylesheet version="1.0" 
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform" 
    xmlns:fo="http://www.w3.org/1999/XSL/Format">

    <xsl:output method="xml" encoding="UTF-8" indent="yes"/>

    <!-- ROOT TEMPLATE -->
    <xsl:template match="/">
        <fo:root xmlns:fo="http://www.w3.org/1999/XSL/Format">
            
            <!-- 1. LAYOUT DEFINITIONS (Master Set) -->
            <fo:layout-master-set>
                <fo:simple-page-master master-name="Ariba-A4" 
                    page-height="29.7cm" page-width="21cm" 
                    margin-top="1cm" margin-bottom="1cm" 
                    margin-left="1.5cm" margin-right="1.5cm">
                    
                    <!-- Region Body (Main content) -->
                    <fo:region-body margin-top="2.5cm" margin-bottom="1.5cm"/>
                    
                    <!-- Region Before (Header) -->
                    <fo:region-before extent="2cm"/>
                    
                    <!-- Region After (Footer) -->
                    <fo:region-after extent="1cm"/>
                </fo:simple-page-master>
            </fo:layout-master-set>

            <!-- 2. PAGE SEQUENCE (Actual Document Content) -->
            <fo:page-sequence master-reference="Ariba-A4">
                
                <!-- STATIC CONTENT: HEADER (Repeats on every page) -->
                <fo:static-content flow-name="xsl-region-before">
                    <fo:block border-bottom="1.5pt solid #003366" padding-bottom="4pt">
                        <fo:table table-layout="fixed" width="100%">
                            <fo:table-column column-width="50%"/>
                            <fo:table-column column-width="50%"/>
                            <fo:table-body>
                                <fo:table-row>
                                    <fo:table-cell>
                                        <fo:block font-size="16pt" font-weight="bold" color="#003366">
                                            SAP Ariba Document
                                        </fo:block>
                                    </fo:table-cell>
                                    <fo:table-cell text-align="right">
                                        <fo:block font-size="9pt" color="#666666">
                                            ID: <xsl:value-of select="/*/@orderID | /*/@asnID"/>
                                        </fo:block>
                                    </fo:table-cell>
                                </fo:table-row>
                            </fo:table-body>
                        </fo:table>
                    </fo:block>
                </fo:static-content>

                <!-- STATIC CONTENT: FOOTER (Repeats on every page) -->
                <fo:static-content flow-name="xsl-region-after">
                    <fo:block border-top="0.5pt solid #cccccc" padding-top="4pt" text-align="center" font-size="8pt" color="#999999">
                        Page <fo:page-number/> of <fo:page-number-citation ref-id="end-of-doc"/>
                    </fo:block>
                </fo:static-content>

                <!-- MAIN FLOW (Body Content) -->
                <fo:flow flow-name="xsl-region-body">
                    
                    <!-- Example Title Block -->
                    <fo:block font-size="14pt" font-weight="bold" margin-top="10pt" margin-bottom="15pt" text-align="center">
                        DOCUMENT SUMMARY
                    </fo:block>

                    <!-- PLACEHOLDER FOR MAIN CONTENT -->
                    <fo:block font-size="11pt">
                        Template is ready. Start by adding your table or descriptive blocks here.
                    </fo:block>

                    <!-- Example: Mapping a Supplier Name -->
                    <xsl:if test="//Supplier/Name">
                        <fo:block font-weight="bold" margin-top="20pt">
                            Supplier: <xsl:value-of select="//Supplier/Name"/>
                        </fo:block>
                    </xsl:if>

                    <!-- ID for page numbering reference (Mandatory) -->
                    <fo:block id="end-of-doc"/>
                </fo:flow>

            </fo:page-sequence>
        </fo:root>
    </xsl:template>

</xsl:stylesheet>
