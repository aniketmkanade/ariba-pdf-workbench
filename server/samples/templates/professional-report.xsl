<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:fo="http://www.w3.org/1999/XSL/Format">
  
  <xsl:output method="xml" indent="yes" encoding="UTF-8"/>
  
  <!-- Root template -->
  <xsl:template match="/Document">
    <fo:root xmlns:fo="http://www.w3.org/1999/XSL/Format">
      <!-- Define page layout -->
      <fo:layout-master-set>
        <!-- Cover page master -->
        <fo:simple-page-master master-name="cover-page" page-height="11in" page-width="8.5in"
                               margin-top="1in" margin-bottom="1in" 
                               margin-left="1in" margin-right="1in">
          <fo:region-body display-align="center"/>
        </fo:simple-page-master>
        <!-- Content page master -->
        <fo:simple-page-master master-name="content-page" page-height="11in" page-width="8.5in"
                               margin-top="0.5in" margin-bottom="0.5in" 
                               margin-left="0.5in" margin-right="0.5in">
          <fo:region-body margin-top="0.5in" margin-bottom="0.5in"/>
          <fo:region-after extent="0.5in" region-name="footer"/>
        </fo:simple-page-master>
        <!-- Last content page master -->
        <fo:simple-page-master master-name="last-content-page" page-height="11in" page-width="8.5in"
                               margin-top="0.5in" margin-bottom="0.5in" 
                               margin-left="0.5in" margin-right="0.5in">
          <fo:region-body margin-top="0.5in" margin-bottom="0.5in"/>
          <fo:region-after extent="0.5in" region-name="last-footer"/>
        </fo:simple-page-master>
        <!-- Page sequence master for content -->
        <fo:page-sequence-master master-name="content-master">
          <fo:repeatable-page-master-alternatives>
            <fo:conditional-page-master-reference page-position="first" master-reference="content-page"/>
            <fo:conditional-page-master-reference page-position="last" master-reference="last-content-page"/>
            <fo:conditional-page-master-reference page-position="rest" master-reference="content-page"/>
          </fo:repeatable-page-master-alternatives>
        </fo:page-sequence-master>
      </fo:layout-master-set>
      
      <!-- Cover page sequence -->
      <fo:page-sequence master-reference="cover-page">
        <fo:flow flow-name="xsl-region-body">
          <fo:block text-align="center" font-size="28pt" font-weight="bold" color="#1a3a52">
            <xsl:value-of select="Cover/Title"/>
          </fo:block>
        </fo:flow>
      </fo:page-sequence>
      
      <!-- Content pages sequence -->
      <fo:page-sequence master-reference="content-master" initial-page-number="2">
        <fo:static-content flow-name="footer">
          <fo:block text-align="center" font-size="10pt" color="#666666">
            Page <fo:page-number/> - Generated on 30/03/2026
          </fo:block>
        </fo:static-content>
        <fo:static-content flow-name="last-footer">
          <fo:block text-align="center" font-size="10pt" color="#666666">
            Page <fo:page-number/> - Generated on 30/03/2026 | *** END OF REPORT ***
          </fo:block>
        </fo:static-content>
        
        <fo:flow flow-name="xsl-region-body">
          <xsl:for-each select="Pages/Page">
            <fo:block font-size="16pt" font-weight="bold" margin-bottom="0.3in" color="#003366">
              <xsl:value-of select="Title"/>
            </fo:block>
            <fo:block font-size="11pt" line-height="1.5" margin-bottom="1in">
              <xsl:value-of select="Content"/>
            </fo:block>
          </xsl:for-each>
        </fo:flow>
      </fo:page-sequence>
    </fo:root>
  </xsl:template>
  
</xsl:stylesheet>
