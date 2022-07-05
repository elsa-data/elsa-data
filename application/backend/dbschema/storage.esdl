module storage {

    scalar type ChecksumType extending enum<'MD5', 'AWS_ETAG', 'SHA_1', 'SHA_256'>;

    type File {
        required property url -> str;
        required property size -> int64;
        required property checksums -> array<tuple<type: ChecksumType, value: str>>;
    }
}
