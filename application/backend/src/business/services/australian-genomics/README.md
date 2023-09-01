## File/object structure

File/objects are expected to be submitted into the dataset in batches and stored by batch
name in a folder. Batches should sort alphabetically by time of submission (so probably an ISO
datetime - but could be incrementing number for all we care).

e.g.

```
my_dataset
  2020-01-03
    file1.bam
    file1.bam.bai
  2020-01-16

  2021-05-03

```

All batches together make up an overall dataset - that is, batches
do not need to be internally self-contained. A fastq pair can span two batches for instance.

Once submitted a batch is considered
immutable (corrections can be made via mechanisms described below). The data model is
accretive.

Content of a batch can currently only be a single level (no nested directories within a batch - though
this restriction may be lifted in the future).

### Checksums

Every submission batch folder MUST have an `md5sums.txt` consisting of the MD5 checksums
of _all_ files in the folder.

```shell
md5sum * > md5sums.txt
-or-
md5sum-lite * > md5sums.txt
```

It is safe to have `md5sum` checksum its own sums file - as this entry will
safely be ignored by the algorithm.

All files in the submission folder MUST be included in the `mds5sums.txt` and all files
listed in the `md5sums.txt` MUST be present in the folder.

### Correction of files

Files can be replaced in a later submission by a new file of the same name.

A file can be deleted by creating a later submission with an empty file of the same name.
